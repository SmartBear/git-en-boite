import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import {
  Author,
  CommitMessage,
  Files,
  LocalClone,
  LocalClones,
  Logger,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import IORedis from 'ioredis'

import { DirectLocalClone } from '.'
import { asSerializedError, deserialize } from './serialize_errors'

interface Closable {
  close(): Promise<void>
}

export class BackgroundWorkerLocalClones implements LocalClones {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue: Queue<any>
  private queueEvents: QueueEvents
  private queueClient: IORedis.Redis
  private worker: Closable = {
    close: async () => {
      //no-op
    },
  }

  static async connect(
    localClones: LocalClones,
    redisUrl: string,
    queueName: string,
    logger: Logger,
  ): Promise<BackgroundWorkerLocalClones> {
    const createRedisClient = async () => connectToRedis(redisUrl)
    return await new this(localClones, createRedisClient, queueName, logger).connect()
  }

  protected constructor(
    private readonly localClones: LocalClones,
    private readonly createRedisClient: () => Promise<IORedis.Redis>,
    private readonly queueName: string,
    private readonly logger: Logger,
  ) {}

  public confirmExists(path: string): boolean {
    return this.localClones.confirmExists(path)
  }

  protected async connect(): Promise<BackgroundWorkerLocalClones> {
    this.queueClient = await this.createRedisClient()
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.queue = new Queue(this.queueName, { connection: this.queueClient })
    // according to the docs, the QueueEvents needs its own connection
    this.queueEvents = new QueueEvents(this.queueName, {
      connection: await this.createRedisClient(),
    })
    return this
  }

  async openExisting(path: string): Promise<LocalClone> {
    const gitRepo = await this.localClones.openExisting(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents, this.logger)
  }

  async createNew(path: string): Promise<LocalClone> {
    const gitRepo = await this.localClones.createNew(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents, this.logger)
  }

  async pingWorkers(timeout = 5000): Promise<void> {
    const job = await this.queue.add('ping', {})
    await job.waitUntilFinished(this.queueEvents, timeout).catch(() => {
      throw new Error(`No workers responded to a ping within ${timeout}ms`)
    })
  }

  async startWorker(logger: Logger): Promise<void> {
    this.worker = await GitRepoWorker.start(
      DirectLocalClone,
      this.createRedisClient,
      logger,
      this.queueName,
    )
  }

  async close(): Promise<void> {
    await this.worker.close()
    await this.queueEvents.close()
    await new Promise(resolve => {
      this.queueClient.on('end', resolve)
      this.queueClient.disconnect()
    })
  }
}

export class BackgroundGitRepoProxy implements LocalClone {
  constructor(
    private readonly path: string,
    private readonly gitRepo: LocalClone,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly queue: Queue<any>,
    private readonly queueEvents: QueueEvents,
    private readonly logger: Logger,
  ) {}

  async commit(
    commitRef: PendingCommitRef,
    files: Files,
    author: Author,
    message: CommitMessage,
  ): Promise<void> {
    await this.gitRepo.commit(commitRef, files, author, message)
  }

  async getRefs(): Promise<Refs> {
    return this.gitRepo.getRefs()
  }

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    const job = await this.queue.add('setOriginTo', { path: this.path, remoteUrl })
    return this.whenFinished(job)
  }

  async fetch(): Promise<void> {
    const job = await this.queue.add('fetch', { path: this.path })
    return this.whenFinished(job)
  }

  async push(commitRef: PendingCommitRef): Promise<void> {
    const job = await this.queue.add('push', { path: this.path, commitRef })
    return this.whenFinished(job)
  }

  private whenFinished(job: Job): Promise<void> {
    return job.waitUntilFinished(this.queueEvents).catch(error => {
      throw deserialize(error, this.logger)
    })
  }
}

class GitRepoWorker implements Closable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected worker: Worker<any>

  static async start(
    localClones: LocalClones,
    createRedisClient: () => Promise<IORedis.Redis>,
    logger: Logger,
    queueName: string,
  ): Promise<GitRepoWorker> {
    const connection = await createRedisClient()
    return new GitRepoWorker(localClones, connection, logger, queueName)
  }

  protected constructor(
    gitRepos: LocalClones,
    readonly redisClient: IORedis.Redis,
    logger: Logger,
    queueName: string,
  ) {
    const processJob = async (job: Job) => {
      try {
        logger.info(`received: ${job.name}`, { job: { name: job.name, data: job.data } })
        if (job.name === 'ping') {
          return {}
        }
        const { path } = job.data
        const git = await gitRepos.openExisting(path)
        if (job.name === 'setOriginTo') {
          const remoteUrl = RemoteUrl.fromJSON(job.data.remoteUrl)
          return await git.setOriginTo(remoteUrl)
        }
        if (job.name === 'fetch') {
          return await git.fetch()
        }
        if (job.name === 'push') {
          const { commitRef } = job.data
          return await git.push(PendingCommitRef.fromJSON(commitRef))
        }
      } catch (error) {
        logger.error(error)
        throw asSerializedError(error)
      }
    }
    // TODO: pass redisUrl to Worker once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.worker = new Worker(queueName, processJob, { connection: this.redisClient })
  }

  async close(): Promise<void> {
    await this.worker.close(true)
    await this.worker.disconnect()
    await this.redisClient.disconnect()
  }
}

async function connectToRedis(url: string): Promise<IORedis.Redis> {
  const connection = new IORedis(url)
  return new Promise((resolve, reject) =>
    connection
      .on('connect', () => resolve(connection))
      .on('error', error => {
        connection.disconnect()
        reject(new Error(`Unable to connect to Redis: ${error.message}`))
      }),
  )
}

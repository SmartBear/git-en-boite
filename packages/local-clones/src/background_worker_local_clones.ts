import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import {
  AccessDenied,
  Author,
  CommitMessage,
  Files,
  InvalidRepoUrl,
  LocalClone,
  LocalClones,
  PendingCommitRef,
  Refs,
  RemoteUrl,
  WriteLogEvent,
  asSerializedError,
  buildDeserializeError,
  LockedByAnotherProcess,
} from 'git-en-boite-core'
import IORedis from 'ioredis'

import { DirectLocalClones } from './direct_local_clone'
import { GitCommandError } from './git_command_error'

export const deserialize = buildDeserializeError(
  AccessDenied,
  Error,
  GitCommandError,
  InvalidRepoUrl,
  LockedByAnotherProcess
)

interface Closable {
  close(): Promise<void>
}

export class BackgroundWorkerLocalClones implements LocalClones {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue: Queue<any>
  private queueEvents: QueueEvents
  private connection: IORedis.Redis
  private worker: Closable = {
    close: async () => {
      //no-op
    },
  }

  static async connect(
    localClones: LocalClones,
    redisUrl: string,
    queueName: string,
    log: WriteLogEvent
  ): Promise<BackgroundWorkerLocalClones> {
    const createRedisClient = async () => connectToRedis(redisUrl)
    return await new this(localClones, createRedisClient, queueName, log).connect()
  }

  protected constructor(
    private readonly localClones: LocalClones,
    private readonly createRedisClient: () => Promise<IORedis.Redis>,
    private readonly queueName: string,
    private readonly log: WriteLogEvent
  ) {}

  public async removeExisting(path: string): Promise<void> {
    await this.localClones.removeExisting(path)
  }

  public confirmExists(path: string): boolean {
    return this.localClones.confirmExists(path)
  }

  protected async connect(): Promise<BackgroundWorkerLocalClones> {
    this.connection = await this.createRedisClient()
    this.queue = new Queue(this.queueName, { connection: this.connection })
    // The QueueEvents needs its own connection
    this.queueEvents = new QueueEvents(this.queueName, {
      connection: await this.createRedisClient(),
    })
    return this
  }

  async openExisting(path: string): Promise<LocalClone> {
    const gitRepo = await this.localClones.openExisting(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents, this.log)
  }

  async createNew(path: string): Promise<LocalClone> {
    const gitRepo = await this.localClones.createNew(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents, this.log)
  }

  async pingWorkers(timeout = 5000): Promise<void> {
    const job = await this.queue.add('ping', {})
    await job.waitUntilFinished(this.queueEvents, timeout).catch(() => {
      throw new Error(`No workers responded to a ping within ${timeout}ms`)
    })
  }

  async startWorker(log: WriteLogEvent): Promise<void> {
    this.worker = await GitRepoWorker.start(new DirectLocalClones(), this.createRedisClient, log, this.queueName)
  }

  async close(): Promise<void> {
    await this.worker.close()
    await this.queueEvents.close()
    await new Promise((resolve) => {
      this.connection.on('end', resolve)
      this.connection.disconnect()
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
    private readonly log: WriteLogEvent
  ) {}

  async commit(commitRef: PendingCommitRef, files: Files, author: Author, message: CommitMessage): Promise<void> {
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
    return job.waitUntilFinished(this.queueEvents).catch((error) => {
      throw deserialize(error, this.log)
    })
  }
}

class GitRepoWorker implements Closable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected worker: Worker<any>

  static async start(
    localClones: LocalClones,
    createRedisClient: () => Promise<IORedis.Redis>,
    log: WriteLogEvent,
    queueName: string
  ): Promise<GitRepoWorker> {
    const connection = await createRedisClient()
    return new GitRepoWorker(localClones, connection, log, queueName)
  }

  protected constructor(
    gitRepos: LocalClones,
    readonly connection: IORedis.Redis,
    log: WriteLogEvent,
    queueName: string
  ) {
    const processJob = async (job: Job) => {
      try {
        log({
          message: `received: ${job.name}`,
          level: 'info',
          job: { name: job.name, data: job.data },
        })
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
        log(error)
        throw asSerializedError(error)
      }
    }
    this.worker = new Worker(queueName, processJob, { connection: this.connection })
  }

  async close(): Promise<void> {
    await this.worker.close(true)
    await this.worker.disconnect()
    await this.connection.disconnect()
  }
}

async function connectToRedis(url: string): Promise<IORedis.Redis> {
  const connection = new IORedis(url)
  return new Promise((resolve, reject) =>
    connection
      .on('connect', () => resolve(connection))
      .on('error', (error) => {
        connection.disconnect()
        reject(new Error(`Unable to connect to Redis: ${error.message}`))
      })
  )
}

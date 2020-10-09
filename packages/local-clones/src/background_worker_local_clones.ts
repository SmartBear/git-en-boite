import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import {
  AccessDenied,
  Author,
  CommitMessage,
  Files,
  InvalidRepoUrl,
  LocalClone,
  Logger,
  OpensLocalClones,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import IORedis from 'ioredis'

import { DirectLocalClone } from './dugite_git_repo'

interface Closable {
  close(): Promise<void>
}

export class BackgroundWorkerLocalClones {
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
    localClones: OpensLocalClones,
    redisUrl: string,
  ): Promise<BackgroundWorkerLocalClones> {
    const createRedisClient = async () => connectToRedis(redisUrl)
    return await new BackgroundWorkerLocalClones(localClones, createRedisClient).connect()
  }

  protected constructor(
    private readonly localClones: OpensLocalClones,
    private readonly createRedisClient: () => Promise<IORedis.Redis>,
  ) {}

  protected async connect(): Promise<BackgroundWorkerLocalClones> {
    this.queueClient = await this.createRedisClient()
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.queue = new Queue('main', { connection: this.queueClient })
    // according to the docs, the QueueEvents needs its own connection
    this.queueEvents = new QueueEvents('main', { connection: await this.createRedisClient() })
    return this
  }

  async openLocalClone(path: string): Promise<LocalClone> {
    const gitRepo = await this.localClones.openLocalClone(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents)
  }

  async pingWorkers(timeout = 5000): Promise<void> {
    const job = await this.queue.add('ping', {})
    await job.waitUntilFinished(this.queueEvents, timeout).catch(() => {
      throw new Error(`No workers responded to a ping within ${timeout}ms`)
    })
  }

  async startWorker(logger: Logger): Promise<void> {
    this.worker = await GitRepoWorker.start(DirectLocalClone, this.createRedisClient, logger)
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
      throw deserialize(error)
    })
  }
}

class GitRepoWorker implements Closable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected worker: Worker<any>

  static async start(
    localClones: OpensLocalClones,
    createRedisClient: () => Promise<IORedis.Redis>,
    logger: Logger,
  ): Promise<GitRepoWorker> {
    const connection = await createRedisClient()
    return new GitRepoWorker(localClones, connection, logger)
  }

  protected constructor(
    gitRepos: OpensLocalClones,
    readonly redisClient: IORedis.Redis,
    logger: Logger,
  ) {
    const processJob = async (job: Job) => {
      try {
        logger.log({ name: job.name, data: job.data })
        if (job.name === 'ping') {
          return {}
        }
        const { path } = job.data
        const git = await gitRepos.openLocalClone(path)
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
    this.worker = new Worker('main', processJob, { connection: this.redisClient })
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

type ErrorEnvelope = {
  type: string
  props: Record<string, unknown>
}

const asSerializedError = <AnError extends Error>(anError: AnError & Record<string, unknown>) => {
  type Props = Record<string, unknown>
  const props = Object.getOwnPropertyNames(anError).reduce<Props>(
    (props, prop) => Object.assign(props, { [prop]: anError[prop] }),
    {},
  )
  const envelope: ErrorEnvelope = { props, type: anError.constructor.name }
  return new Error(JSON.stringify(envelope))
}

const buildDeserializeError = (...constructors: Array<{ new (message?: string): Error }>) => (
  anError: Error,
): Error => {
  if (!hasSerializedMessage(anError)) return anError
  const errorEnvelope: ErrorEnvelope = JSON.parse(anError.message)
  const Constructor = constructors.find(constructor => constructor.name === errorEnvelope.type)
  return Object.assign(new Constructor(), errorEnvelope.props)

  function hasSerializedMessage(error: Error) {
    try {
      return JSON.parse(error.message) instanceof Object
    } catch (parseError) {
      if (parseError instanceof SyntaxError) return false
      throw parseError
    }
  }
}

const deserialize = buildDeserializeError(InvalidRepoUrl, AccessDenied)

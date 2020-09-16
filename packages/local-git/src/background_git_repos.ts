import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import {
  Author,
  CommitMessage,
  Files,
  GitError,
  GitRepo,
  Logger,
  OpenGitRepo,
  OpensGitRepos,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import IORedis from 'ioredis'

import { DugiteGitRepo } from './dugite_git_repo'

interface Closable {
  close(): Promise<void>
}

export class BackgroundGitRepos {
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
    gitRepos: { openGitRepo: OpenGitRepo },
    redisUrl: string,
  ): Promise<BackgroundGitRepos> {
    const createRedisClient = async () => connectToRedis(redisUrl)
    return await new BackgroundGitRepos(gitRepos, createRedisClient).connect()
  }

  protected constructor(
    private readonly gitRepos: { openGitRepo: OpenGitRepo },
    private readonly createRedisClient: () => Promise<IORedis.Redis>,
  ) {}

  protected async connect(): Promise<BackgroundGitRepos> {
    this.queueClient = await this.createRedisClient()
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.queue = new Queue('main', { connection: this.queueClient })
    // according to the docs, the QueueEvents needs its own connection
    this.queueEvents = new QueueEvents('main', { connection: await this.createRedisClient() })
    return this
  }

  async openGitRepo(path: string): Promise<GitRepo> {
    const gitRepo = await this.gitRepos.openGitRepo(path)
    return new BackgroundGitRepoProxy(path, gitRepo, this.queue, this.queueEvents)
  }

  async pingWorkers(timeout = 3000): Promise<void> {
    const job = await this.queue.add('ping', {})
    await job.waitUntilFinished(this.queueEvents, timeout).catch(() => {
      throw new Error(`No workers responded to a ping within ${timeout}ms`)
    })
  }

  async startWorker(logger: Logger): Promise<void> {
    this.worker = await GitRepoWorker.start(DugiteGitRepo, this.createRedisClient, logger)
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

export class BackgroundGitRepoProxy implements GitRepo {
  constructor(
    private readonly path: string,
    private readonly gitRepo: GitRepo,
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

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    const job = await this.queue.add('setOriginTo', { path: this.path, remoteUrl })
    return job.waitUntilFinished(this.queueEvents).catch(error => {
      throw GitError.deserialise(error)
    })
  }

  async fetch(): Promise<void> {
    const job = await this.queue.add('fetch', { path: this.path })
    // TODO: catch and de-serialize errors
    return job.waitUntilFinished(this.queueEvents)
  }

  async push(commitRef: PendingCommitRef): Promise<void> {
    const job = await this.queue.add('push', { path: this.path, commitRef })
    // TODO: catch and de-serialize errors
    return job.waitUntilFinished(this.queueEvents)
  }

  getRefs(): Promise<Refs> {
    return this.gitRepo.getRefs()
  }
}

class GitRepoWorker implements Closable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected worker: Worker<any>

  static async start(
    gitRepos: OpensGitRepos,
    createRedisClient: () => Promise<IORedis.Redis>,
    logger: Logger,
  ): Promise<GitRepoWorker> {
    const connection = await createRedisClient()
    return new GitRepoWorker(gitRepos, connection, logger)
  }

  protected constructor(
    gitRepos: OpensGitRepos,
    readonly redisClient: IORedis.Redis,
    logger: Logger,
  ) {
    const processJob = async (job: Job) => {
      logger.log({ name: job.name, data: job.data })
      if (job.name === 'ping') {
        return {}
      }
      const { path } = job.data
      const git = await gitRepos.openGitRepo(path)
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

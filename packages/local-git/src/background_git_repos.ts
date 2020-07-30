import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import { GitRepo, OpenGitRepo, OpensGitRepos, Ref } from 'git-en-boite-core'
import IORedis from 'ioredis'

import { DugiteGitRepo } from './dugite_git_repo'

interface Closable {
  close(): Promise<void>
}

export class BackgroundGitRepos {
  private queue: Queue<any>
  private queueEvents: QueueEvents
  private queueClient: IORedis.Redis
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private worker: Closable = { close: async () => {} }

  static async connect(
    gitRepos: { openGitRepo: OpenGitRepo },
    redisUrl: string,
  ): Promise<BackgroundGitRepos> {
    const createRedisClient = () => connectToRedis(redisUrl)
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

  async pingWorkers(timeout = 2000): Promise<BackgroundGitRepos> {
    const job = await this.queue.add('ping', {})
    await Promise.race([
      job.waitUntilFinished(this.queueEvents),
      new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(`No workers responded to a ping within ${timeout}ms`)
        }, timeout)
      }),
    ])
    return this
  }

  async startWorker(): Promise<void> {
    this.worker = await GitRepoWorker.start(DugiteGitRepo, this.createRedisClient)
  }

  async close(): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.queue.close(),
      this.queueEvents.close(),
      this.queueClient.disconnect(),
    ])
  }
}

export class BackgroundGitRepoProxy implements GitRepo {
  constructor(
    private readonly path: string,
    private readonly gitRepo: GitRepo,
    private readonly queue: Queue<any>,
    private readonly queueEvents: QueueEvents,
  ) {}

  async connect(remoteUrl: string): Promise<void> {
    const job = await this.queue.add('connect', { path: this.path, remoteUrl })
    return job.waitUntilFinished(this.queueEvents)
  }

  async fetch(): Promise<void> {
    const job = await this.queue.add('fetch', { path: this.path })
    return job.waitUntilFinished(this.queueEvents)
  }

  getRefs(): Promise<Ref[]> {
    return this.gitRepo.getRefs()
  }
}

class GitRepoWorker implements Closable {
  protected worker: Worker<any>

  static async start(
    gitRepos: OpensGitRepos,
    createRedisClient: () => Promise<IORedis.Redis>,
  ): Promise<GitRepoWorker> {
    const connection = await createRedisClient()
    return new GitRepoWorker(gitRepos, connection)
  }

  protected constructor(gitRepos: OpensGitRepos, readonly redisClient: IORedis.Redis) {
    // TODO: pass redisUrl to Worker once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.worker = new Worker(
      'main',
      async (job: Job) => {
        if (job.name === 'ping') {
          return {}
        }
        const { path } = job.data
        const git = await gitRepos.openGitRepo(path)
        if (job.name === 'connect') {
          const { remoteUrl } = job.data
          return await git.connect(remoteUrl)
        }
        if (job.name === 'fetch') {
          return await git.fetch()
        }
      },
      { connection: this.redisClient },
    )
  }

  async close(): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.redisClient.disconnect(),
      this.worker.disconnect(),
    ])
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

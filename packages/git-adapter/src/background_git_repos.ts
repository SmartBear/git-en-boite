import { Queue, QueueEvents, RedisOptions, Job, Worker } from 'bullmq'
import { GitRepo, OpenGitRepo, Ref, OpensGitRepos } from 'git-en-boite-core'
import IORedis from 'ioredis'

export class BackgroundGitRepos {
  private readonly queue: Queue<any>
  private readonly queueEvents: QueueEvents
  private queueClient: IORedis.Redis
  private worker: BackgroundGitRepoWorker

  static async connect(
    gitRepos: { openGitRepo: OpenGitRepo },
    redisOptions: RedisOptions,
  ): Promise<BackgroundGitRepos> {
    return new BackgroundGitRepos(gitRepos, redisOptions)
  }

  protected constructor(
    private readonly gitRepos: { openGitRepo: OpenGitRepo },
    private readonly redisOptions: RedisOptions,
  ) {
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.queueClient = new IORedis(redisOptions)
    this.queue = new Queue('main', { connection: this.queueClient })
    // according to the docs, the QueueEvents needs its own connection
    this.queueEvents = new QueueEvents('main', { connection: new IORedis(redisOptions) })
  }

  async openGitRepo(path: string): Promise<GitRepo> {
    const gitRepo = await this.gitRepos.openGitRepo(path)
    return new BackgroundGitRepo(path, gitRepo, this.queue, this.queueEvents)
  }

  async startWorker(): Promise<void> {
    this.worker = await BackgroundGitRepoWorker.start(this.gitRepos, this.redisOptions)
  }

  async close(): Promise<void> {
    const closeWorker = async () => {
      if (!this.worker) return
      return this.worker.close()
    }
    await Promise.all([
      closeWorker(),
      this.queue.close(),
      this.queueEvents.close(),
      this.queueClient.disconnect(),
    ])
  }
}

export class BackgroundGitRepo implements GitRepo {
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

export class BackgroundGitRepoWorker {
  protected worker: Worker<any>
  private redisClient: IORedis.Redis

  static async start(
    gitRepos: OpensGitRepos,
    redisOptions: RedisOptions,
  ): Promise<BackgroundGitRepoWorker> {
    return new BackgroundGitRepoWorker(gitRepos, redisOptions)
  }

  protected constructor(gitRepos: OpensGitRepos, redisOptions: RedisOptions) {
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.redisClient = new IORedis(redisOptions)
    this.worker = new Worker(
      'main',
      async (job: Job) => {
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

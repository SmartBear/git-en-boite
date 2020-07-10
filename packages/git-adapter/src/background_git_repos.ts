import { Queue, QueueEvents, RedisOptions } from 'bullmq'
import { GitRepo, OpenGitRepo, Ref, OpensGitRepos } from 'git-en-boite-core'
import IORedis from 'ioredis'

export class BackgroundGitRepos {
  private readonly queue: Queue<any>
  private readonly queueEvents: QueueEvents
  private queueClient: IORedis.Redis

  static async connect(
    gitRepos: { openGitRepo: OpenGitRepo },
    redisOptions: RedisOptions,
  ): Promise<BackgroundGitRepos> {
    return new BackgroundGitRepos(gitRepos, redisOptions)
  }

  protected constructor(
    private readonly gitRepos: { openGitRepo: OpenGitRepo },
    redisOptions: RedisOptions,
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

  async close(): Promise<void> {
    await Promise.all([this.queue.close(), this.queueEvents.close(), this.queueClient.disconnect()])
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

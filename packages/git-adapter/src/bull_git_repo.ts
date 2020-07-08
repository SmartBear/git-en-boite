import { Queue, QueueEvents, RedisOptions } from 'bullmq'
import { GitRepo, OpenGitRepo, Ref } from 'git-en-boite-core'
import IORedis from 'ioredis'

export class BullGitRepoFactory {
  private readonly queue: Queue<any>
  private readonly queueEvents: QueueEvents
  private redisClient: IORedis.Redis

  constructor(private readonly openGitRepo: OpenGitRepo, redisOptions: RedisOptions) {
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.redisClient = new IORedis(redisOptions)
    this.queue = new Queue('main', { connection: this.redisClient })
    // according to the docs, the QueueEvents needs it's own connection
    this.queueEvents = new QueueEvents('main', { connection: redisOptions })
  }

  async open(path: string): Promise<GitRepo> {
    const gitRepo = await this.openGitRepo(path)
    return new BullGitRepo(path, gitRepo, this.queue, this.queueEvents)
  }

  async close(): Promise<void> {
    await Promise.all([this.queue.close(), this.queueEvents.close(), this.redisClient.disconnect()])
  }
}

export class BullGitRepo implements GitRepo {
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

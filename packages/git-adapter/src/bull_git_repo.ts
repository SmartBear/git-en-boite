import { Queue, QueueEvents, RedisOptions } from 'bullmq'
import { GitRepo, OpenGitRepo, Ref } from 'git-en-boite-core'
import IORedis from 'ioredis'

export class BullGitRepo implements GitRepo {
  static open(
    openGitRepo: OpenGitRepo,
    connection: RedisOptions,
  ): (path: string) => Promise<GitRepo> {
    return async path => {
      const gitRepo = await openGitRepo(path)
      return await new BullGitRepo(path, gitRepo, connection)
    }
  }

  queue: Queue<any>
  queueEvents: QueueEvents

  protected constructor(
    private readonly path: string,
    private readonly gitRepo: GitRepo,
    connection: RedisOptions,
  ) {
    this.queue = new Queue('main', { connection })
    this.queueEvents = new QueueEvents('main', { connection })
  }

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

  async close(): Promise<void> {
    await Promise.all([this.queue.close(), this.queueEvents.close()])
  }
}

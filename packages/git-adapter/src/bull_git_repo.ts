import { Queue, QueueEvents, RedisOptions } from 'bullmq'
import { GitRepo, OpenGitRepo, Ref } from 'git-en-boite-core'

export class BullGitRepoFactory {
  private readonly queue: Queue<any>
  private readonly queueEvents: QueueEvents

  constructor(private readonly openGitRepo: OpenGitRepo, connection: RedisOptions) {
    this.queue = new Queue('main', { connection })
    this.queueEvents = new QueueEvents('main', { connection })
  }

  async open(path: string): Promise<GitRepo> {
    const gitRepo = await this.openGitRepo(path)
    return new BullGitRepo(path, gitRepo, this.queue, this.queueEvents)
  }

  async close(): Promise<void> {
    await Promise.all([this.queue.close(), this.queueEvents.close()])
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

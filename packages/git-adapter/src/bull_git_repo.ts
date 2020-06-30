import { Queue, QueueEvents } from 'bullmq'
import { GitRepo, Ref, OpenGitRepo } from 'git-en-boite-core'

import { DugiteGitRepo } from './dugite_git_repo'

export class BullGitRepo implements GitRepo {
  static async open(path: string, openGitRepo: OpenGitRepo = DugiteGitRepo.open): Promise<GitRepo> {
    const gitRepo = await openGitRepo(path)
    return new BullGitRepo(path, gitRepo)
  }

  queue: Queue<any>
  queueEvents: QueueEvents
  gitRepo: GitRepo

  protected constructor(private readonly path: string, gitRepo: GitRepo) {
    this.queue = new Queue('main')
    this.queueEvents = new QueueEvents('main')
    this.gitRepo = gitRepo
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
}

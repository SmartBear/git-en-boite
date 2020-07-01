import { Job, RedisOptions, Worker } from 'bullmq'
import { OpenGitRepo } from 'git-en-boite-core'
import IORedis, { Redis } from 'ioredis'

export class BullGitRepoWorker {
  protected worker: Worker<any>

  static async open(
    connection: RedisOptions,
    openGitRepo: OpenGitRepo,
  ): Promise<BullGitRepoWorker> {
    return await new BullGitRepoWorker(connection, openGitRepo)
  }

  protected constructor(connection: RedisOptions, openGitRepo: OpenGitRepo) {
    this.worker = new Worker(
      'main',
      async (job: Job) => {
        const { path } = job.data
        const git = await openGitRepo(path)
        if (job.name === 'connect') {
          const { remoteUrl } = job.data
          return await git.connect(remoteUrl)
        }
        if (job.name === 'fetch') {
          return await git.fetch()
        }
      },
      { connection },
    )
  }

  async close(): Promise<void> {
    await this.worker.close()
    await (await (this.worker as any).blockingConnection.client).disconnect()
    return this.worker.disconnect()
  }
}

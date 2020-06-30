import { Job, Worker } from 'bullmq'
import { DugiteGitRepo } from '.'

export class BullGitRepoWorker {
  protected worker: Worker<any>

  static async open(): Promise<BullGitRepoWorker> {
    return new BullGitRepoWorker().waitUntilReady()
  }

  protected async waitUntilReady(): Promise<BullGitRepoWorker> {
    await this.worker.waitUntilReady()
    return this
  }

  protected constructor() {
    this.worker = new Worker('main', async (job: Job) => {
      const { path } = job.data
      const git = await DugiteGitRepo.open(path)
      if (job.name === 'connect') {
        const { remoteUrl } = job.data
        await git.connect(remoteUrl)
        return
      }
      if (job.name === 'fetch') {
        await git.fetch()
        return
      }
    })
  }

  async close(): Promise<void> {
    await this.worker.close()
    await (await (this.worker as any).blockingConnection.client).disconnect()
    return this.worker.disconnect()
  }
}

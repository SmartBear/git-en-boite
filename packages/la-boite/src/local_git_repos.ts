import { Job, Queue, QueueBase, Worker } from 'bullmq'
import fs from 'fs'
import {
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  GitRepos,
  QueryResult,
} from 'git-en-boite-client-port'
import { GitRepoFactory } from 'git-en-boite-git-adapter'
import { Connect, Fetch, GetRefs } from 'git-en-boite-git-port'
import { RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'
import IORedis from 'ioredis'
import path from 'path'

import { createConfig } from './config'

const config = createConfig()

interface Processors {
  [jobName: string]: (jobData: { [key: string]: any }) => Promise<any>
}

type QueueComponents = [Queue, Worker]

class RepoFolder {
  readonly path: string
  readonly gitRepoPath: string

  constructor(basePath: string, repoId: string) {
    const folderName = Buffer.from(repoId).toString('hex')
    this.path = path.resolve(basePath, folderName)
    this.gitRepoPath = path.resolve(this.path, 'git')
  }
}

class BullRepoTaskScheduler implements RepoTaskScheduler {
  private repoQueueComponents: Map<string, QueueComponents> = new Map()
  private closables: QueueBase[] = []

  constructor(private readonly processors: Processors) {}

  async close(): Promise<void> {
    await Promise.all(
      this.closables.map(async closable => {
        await closable.close()
        // TODO: remove workaround when issues are fixed in bullmq:
        // https://github.com/taskforcesh/bullmq/issues/180
        // https://github.com/taskforcesh/bullmq/issues/159
        if (closable instanceof Worker)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (await (closable as any).blockingConnection.client).disconnect()
        await closable.disconnect()
      }),
    )
  }

  public async schedule(repoId: string, taskName: string, taskData: { [key: string]: any }) {
    const queue = this.getQueue(repoId)
    await queue.add(taskName, taskData)
  }

  async waitUntilIdle(repoId: string): Promise<void> {
    const [queue, worker] = this.getQueueComponentsForRepo(repoId)
    const counts = await queue.getJobCounts()

    if (counts.active === 0 && counts.delayed === 0 && counts.waiting === 0)
      return Promise.resolve()
    return new Promise(resolve => worker.on('drained', resolve))
  }

  private getQueue(repoId: string): Queue {
    const [queue] = this.getQueueComponentsForRepo(repoId)
    return queue
  }

  private getQueueComponentsForRepo(repoId: string): QueueComponents {
    if (!this.repoQueueComponents.has(repoId))
      this.repoQueueComponents.set(repoId, this.createRepoQueue(repoId))
    return this.repoQueueComponents.get(repoId)
  }

  private createRepoQueue(repoId: string): QueueComponents {
    const connection = new IORedis(config.redis)
    const queue = new Queue(repoId, { connection })

    const worker = new Worker(
      repoId,
      (job: Job) => {
        const processor = this.processors[job.name] || ((): Promise<void> => undefined)
        return processor(job.data)
      },
      { connection },
    )
    worker.on('failed', (job, err) =>
      console.error(
        `Worker failed while processing job #${job.id} "${job.name}" for repo "${repoId}"`,
        err,
      ),
    )

    this.closables.push(queue)
    this.closables.push(worker)

    return [queue, worker]
  }
}

export class LocalGitRepos implements GitRepos {
  private readonly taskScheduler: RepoTaskScheduler

  constructor(private readonly basePath: string) {
    const processors: Processors = {
      connect: async ({ repoPath, remoteUrl }) => {
        const git = await new GitRepoFactory().open(repoPath)
        await git(Connect.toUrl(remoteUrl))
      },

      fetch: async ({ repoPath }) => {
        const git = await new GitRepoFactory().open(repoPath)
        await git(Fetch.fromOrigin())
      },
    }
    this.taskScheduler = new BullRepoTaskScheduler(processors)
  }

  async close(): Promise<void> {
    await this.taskScheduler.close()
  }

  async waitUntilIdle(repoId: string): Promise<void> {
    return this.taskScheduler.waitUntilIdle(repoId)
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    await this.taskScheduler.schedule(repoId, 'connect', {
      repoId,
      repoPath: this.repoFolder(repoId).gitRepoPath,
      remoteUrl,
    })
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!this.exists(repoId)) return QueryResult.from()
    const repoPath = this.repoFolder(repoId).gitRepoPath
    const git = await new GitRepoFactory().open(repoPath)
    const refs = await git(GetRefs.all())
    const branches: Branch[] = refs
      .filter(ref => ref.isRemote)
      .map(ref => {
        return {
          name: ref.branchName,
          refName: ref.refName,
          revision: ref.revision,
        }
      })
    return QueryResult.from({ repoId, refs, branches })
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest): Promise<void> {
    this.taskScheduler.schedule(repoId, 'fetch', {
      repoId,
      repoPath: this.repoFolder(repoId).gitRepoPath,
    })
  }

  private repoFolder(repoId: string) {
    return new RepoFolder(this.basePath, repoId)
  }

  private exists(repoId: string): boolean {
    return fs.existsSync(this.repoFolder(repoId).path)
  }
}

import IORedis from 'ioredis'
import { Job, Queue, QueueBase, Worker } from 'bullmq'
import { createConfig } from '../config'
import fs from 'fs'
import path from 'path'

import { QueryResult } from '../query_result'
import { Branch, ConnectRepoRequest, FetchRepoRequest, GitRepoInfo, GitRepos } from './interfaces'
import { LocalGitRepo } from './local_git_repo'

const config = createConfig()

interface Processors {
  [jobName: string]: Function
}

type QueueComponents = [Queue, Worker]

const processors: Processors = {
  clone: async (job: Job) => {
    const { repoPath, remoteUrl } = job.data
    const repo = await LocalGitRepo.open(repoPath)
    await repo.execGit('init', '--bare')
    await repo.execGit('config', 'gc.auto', '0')
    await repo.execGit('config', 'gc.pruneExpire', 'never') // don't prune objects if GC runs
    await repo.execGit('remote', 'add', 'origin', remoteUrl)
    await repo.execGit('fetch', 'origin')
  },

  fetch: async (job: Job) => {
    const { repoPath } = job.data
    const repo = await LocalGitRepo.open(repoPath)
    await repo.execGit('fetch', '--prune', 'origin')
  },
}

const getJobProcessor = (job: Job): Function => () =>
  (processors[job.name] || ((): void => undefined))(job)

class RepoFolder {
  readonly path: string
  readonly gitRepoPath: string

  constructor(basePath: string, repoId: string) {
    const folderName = Buffer.from(repoId).toString('hex')
    this.path = path.resolve(basePath, folderName)
    this.gitRepoPath = path.resolve(this.path, 'git')
  }
}

export class LocalGitRepos implements GitRepos {
  basePath: string
  private repoQueueComponents: Map<string, QueueComponents> = new Map()
  private closables: QueueBase[] = []

  constructor(basePath: string) {
    this.basePath = basePath
  }

  async close() {
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

  async waitUntilIdle(repoId: string): Promise<unknown> {
    const [queue, worker] = this.getQueueComponentsForRepo(repoId)
    const counts = await queue.getJobCounts()

    if (counts.active === 0 && counts.delayed === 0 && counts.waiting === 0)
      return Promise.resolve()
    // return new Promise(resolve => setTimeout(resolve, 150))
    return new Promise(resolve => worker.on('drained', resolve))
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    const queue = this.getQueueForRepo(repoId)
    await queue.add('clone', {
      repoId,
      repoPath: this.repoFolder(repoId).gitRepoPath,
      remoteUrl,
    })
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!this.exists(repoId)) return QueryResult.from()
    const repo = await LocalGitRepo.open(this.repoFolder(repoId).gitRepoPath)
    const refs = await repo.refs()
    const branches: Branch[] = refs
      .filter(ref => ref.name.startsWith('refs/remotes/origin/'))
      .map(ref => {
        return {
          name: ref.name.replace('refs/remotes/origin/', ''),
          refName: ref.name,
          revision: ref.revision,
        }
      })
    return QueryResult.from({ repoId, refs, branches })
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest) {
    const queue = this.getQueueForRepo(repoId)
    await queue.add('fetch', {
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

  private getQueueForRepo(repoId: string): Queue {
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
    const worker = new Worker(repoId, (job: Job) => getJobProcessor(job)(), {
      connection,
    })
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

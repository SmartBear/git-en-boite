import path from 'path'
import fs from 'fs'
import { GitRepos, ConnectRepoRequest } from './git_repos'
import { GitRepo } from './git_repo'
import { LocalGitRepo } from './local_git_repo'
import { QueryResult } from '../query_result'
import Queue from 'bull'

export class LocalGitRepos implements GitRepos {
  basePath: string
  private repoQueue: Map<string, Queue.Queue> = new Map()

  constructor(basePath: string) {
    this.basePath = basePath
  }

  async close() {
    return Promise.all(Array.from(this.repoQueue.values()).map(queue => queue.close()))
  }

  async waitUntilIdle(repoId: string): Promise<unknown> {
    const queue = this.getQueueForRepo(repoId)
    const counts = await queue.getJobCounts()
    if (counts.active === 0 && counts.delayed === 0 && counts.waiting === 0)
      return Promise.resolve()
    return new Promise(resolve => queue.on('drained', resolve))
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    const repoPath = path.resolve(this.basePath, repoId)
    const queue = this.getQueueForRepo(repoId)
    await queue.add('clone', {
      repoId,
      repoPath,
      remoteUrl,
    })
  }

  findRepo(repoId: string): QueryResult<GitRepo> {
    const repoPath = path.resolve(this.basePath, repoId)
    if (!fs.existsSync(repoPath)) return new QueryResult()
    return new QueryResult(new LocalGitRepo(repoPath))
  }

  private getQueueForRepo(repoId: string): Queue.Queue {
    if (!this.repoQueue.has(repoId)) this.repoQueue.set(repoId, this.createRepoQueue(repoId))
    return this.repoQueue.get(repoId)
  }

  private createRepoQueue(repoId: string): Queue.Queue {
    const result = new Queue(repoId)
    result.process('clone', async job => {
      const { repoPath, remoteUrl } = job.data
      const repo = await LocalGitRepo.open(repoPath)
      await repo.git('clone', remoteUrl, '.')
    })
    result.on('failed', (job, err) =>
      console.error(`Error processing job #${job.id} for repo "${repoId}"`, err),
    )
    return result
  }
}

import path from 'path'
import fs from 'fs'
import { GitRepos, ConnectRepoRequest, GitRepoInfo } from './git_repos'
import { LocalGitRepo } from './local_git_repo'
import { QueryResult } from '../query_result'
import Queue from 'bull'
import { createConfig } from '../config'
const config = createConfig()

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
    const queue = this.getQueueForRepo(repoId)
    await queue.add('clone', {
      repoId,
      repoPath: this.repoFolder(repoId).gitRepoPath,
      remoteUrl,
    })
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!this.exists(repoId)) return QueryResult.from()
    const repo = new LocalGitRepo(this.repoFolder(repoId).gitRepoPath)
    const refs = await repo.refs()
    return QueryResult.from({ repoId, refs })
  }

  private repoFolder(repoId: string) {
    return new RepoFolder(this.basePath, repoId)
  }

  private exists(repoId: string): boolean {
    return fs.existsSync(this.repoFolder(repoId).path)
  }

  private getQueueForRepo(repoId: string): Queue.Queue {
    if (!this.repoQueue.has(repoId)) this.repoQueue.set(repoId, this.createRepoQueue(repoId))
    return this.repoQueue.get(repoId)
  }

  private createRepoQueue(repoId: string): Queue.Queue {
    const result = new Queue(repoId, config.redis.url)
    result.process('clone', async job => {
      const { repoPath, remoteUrl } = job.data
      const repo = await LocalGitRepo.open(repoPath)
      await repo.git('init', '--bare')
      await repo.git('config', 'gc.auto', '0')
      await repo.git('config', 'gc.pruneExpire', 'never') // don't prune objects if GC runs
      await repo.git('remote', 'add', 'origin', remoteUrl)
      await repo.git('fetch', '--prune', 'origin', '+refs/*:refs/*')
    })
    result.on('failed', (job, err) =>
      console.error(`Error processing job #${job.id} for repo "${repoId}"`, err),
    )
    return result
  }
}

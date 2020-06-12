import fs from 'fs'
import {
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  GitRepos,
  QueryResult,
} from 'git-en-boite-client-port'
import { BareRepoFactory } from 'git-en-boite-git-adapter'
import { Connect, Fetch, GetRefs } from 'git-en-boite-git-port'
import { ConnectTask, FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'
import path from 'path'
import { TinyTypeOf } from 'tiny-types'
import { Ref } from 'git-en-boite-core'

class RepoPath extends TinyTypeOf<string>() {
  static for(basePath: string, repoId: string): RepoPath {
    const folderName = Buffer.from(repoId).toString('hex')
    return new RepoPath(path.resolve(basePath, folderName))
  }
}

export class LocalGitRepos implements GitRepos {
  constructor(
    private readonly basePath: string,
    private readonly taskScheduler: RepoTaskScheduler,
  ) {
    this.taskScheduler = taskScheduler
      .withProcessor('connect', async ({ repoPath, remoteUrl }) => {
        const git = await new BareRepoFactory().open(repoPath)
        await git(Connect.toUrl(remoteUrl))
      })
      .withProcessor('fetch', async ({ repoPath }) => {
        const git = await new BareRepoFactory().open(repoPath)
        await git(Fetch.fromOrigin())
      })
  }

  async close(): Promise<void> {
    await this.taskScheduler.close()
  }

  async waitUntilIdle(repoId: string): Promise<void> {
    return this.taskScheduler.waitUntilIdle(repoId)
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    await this.taskScheduler.schedule(
      repoId,
      new ConnectTask(remoteUrl, RepoPath.for(this.basePath, repoId).value),
    )
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest): Promise<void> {
    this.taskScheduler.schedule(repoId, new FetchTask(RepoPath.for(this.basePath, repoId).value))
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!this.exists(repoId)) return QueryResult.from()
    const repoPath = RepoPath.for(this.basePath, repoId).value
    const git = await new BareRepoFactory().open(repoPath)
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

  private exists(repoId: string): boolean {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

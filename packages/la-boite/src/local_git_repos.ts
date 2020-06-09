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
import { ConnectTask, FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'
import path from 'path'

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
  constructor(
    private readonly basePath: string,
    private readonly taskScheduler: RepoTaskScheduler,
  ) {
    this.taskScheduler = taskScheduler
      .withProcessor('connect', async ({ repoPath, remoteUrl }) => {
        const git = await new GitRepoFactory().open(repoPath)
        await git(Connect.toUrl(remoteUrl))
      })
      .withProcessor('fetch', async ({ repoPath }) => {
        const git = await new GitRepoFactory().open(repoPath)
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
      new ConnectTask(remoteUrl, this.repoFolder(repoId).gitRepoPath),
    )
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest): Promise<void> {
    this.taskScheduler.schedule(repoId, new FetchTask(this.repoFolder(repoId).gitRepoPath))
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

  private repoFolder(repoId: string) {
    return new RepoFolder(this.basePath, repoId)
  }

  private exists(repoId: string): boolean {
    return fs.existsSync(this.repoFolder(repoId).path)
  }
}

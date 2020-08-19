import {
  Application,
  File,
  GitRepoInfo,
  QueryResult,
  RepoIndex,
  BranchName,
} from 'git-en-boite-core'

export class LaBoîte implements Application {
  constructor(private readonly repoIndex: RepoIndex, public readonly version: string) {}

  async commit(repoId: string, branchName: BranchName, file: File): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.commit(branchName, file)
  }

  async connectToRemote(repoId: string, remoteUrl: string): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.setOriginTo(remoteUrl)
  }

  async fetchFromRemote(repoId: string): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.fetch()
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!(await this.repoIndex.exists(repoId))) return QueryResult.from()
    const repo = await this.repoIndex.find(repoId)
    const branches = await repo.branches()
    const result: GitRepoInfo = { repoId, branches }
    return QueryResult.from(result)
  }
}

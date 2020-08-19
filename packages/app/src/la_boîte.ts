import {
  Application,
  Author,
  File,
  GitRepoInfo,
  QueryResult,
  RepoIndex,
  BranchName,
  RepoId,
} from 'git-en-boite-core'

export class LaBoîte implements Application {
  constructor(private readonly repoIndex: RepoIndex, public readonly version: string) {}

  async commit(
    repoId: RepoId,
    branchName: BranchName,
    files: File[],
    author: Author,
  ): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.commit(branchName, files, author)
  }

  async connectToRemote(repoId: RepoId, remoteUrl: string): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.setOriginTo(remoteUrl)
  }

  async fetchFromRemote(repoId: RepoId): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.fetch()
  }

  async getInfo(repoId: RepoId): Promise<QueryResult<GitRepoInfo>> {
    if (!(await this.repoIndex.exists(repoId))) return QueryResult.from()
    const repo = await this.repoIndex.find(repoId)
    const branches = await repo.branches()
    const result: GitRepoInfo = { repoId, branches }
    return QueryResult.from(result)
  }
}

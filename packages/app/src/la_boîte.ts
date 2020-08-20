import {
  Application,
  Author,
  BranchName,
  RepoId,
  CommitMessage,
  File,
  GitRepoInfo,
  QueryResult,
  RepoIndex,
} from 'git-en-boite-core'
import { RemoteUrl } from 'git-en-boite-core/dist/remote_url'

export class LaBoîte implements Application {
  constructor(private readonly repoIndex: RepoIndex, public readonly version: string) {}

  async commit(
    repoId: RepoId,
    branchName: BranchName,
    files: File[],
    author: Author,
    message: CommitMessage,
  ): Promise<void> {
    const repo = await this.repoIndex.find(repoId)
    await repo.commit(branchName, files, author, message)
  }

  async connectToRemote(repoId: RepoId, remoteUrl: RemoteUrl): Promise<void> {
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

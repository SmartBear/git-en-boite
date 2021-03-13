import {
  Application,
  Author,
  BranchName,
  CommitMessage,
  CommitName,
  FileContent,
  FilePath,
  Files,
  InventoryOfRepos,
  QueryResult,
  RemoteUrl,
  RepoId,
  RepoSnapshot,
  SubscribesToDomainEvents,
} from 'git-en-boite-core'

export class LaBoîte implements Application {
  constructor(
    private readonly inventoryOfRepos: InventoryOfRepos,
    public readonly version: string,
    public readonly events: SubscribesToDomainEvents
  ) {}

  async commit(
    repoId: RepoId,
    branchName: BranchName,
    files: Files,
    author: Author,
    message: CommitMessage
  ): Promise<void> {
    const repo = await this.inventoryOfRepos.find(repoId)
    await repo.fetch()
    await repo.commit(branchName, files, author, message)
  }

  async connectToRemote(repoId: RepoId, remoteUrl: RemoteUrl): Promise<void> {
    if (await this.inventoryOfRepos.exists(repoId)) {
      const repo = await this.inventoryOfRepos.find(repoId)
      await repo.setOriginTo(remoteUrl)
    } else {
      await this.inventoryOfRepos.create(repoId, (repo) => repo.setOriginTo(remoteUrl))
    }
  }

  async fetchFromRemote(repoId: RepoId): Promise<void> {
    const repo = await this.inventoryOfRepos.find(repoId)
    await repo.fetch()
  }

  async getInfo(repoId: RepoId): Promise<QueryResult<RepoSnapshot>> {
    if (!(await this.inventoryOfRepos.exists(repoId))) return QueryResult.from()
    const repo = await this.inventoryOfRepos.find(repoId)
    const branches = await repo.branches()
    return QueryResult.from(new RepoSnapshot(repoId, branches))
  }

  async getFileContent(repoId: RepoId, revision: CommitName, location: FilePath): Promise<QueryResult<FileContent>> {
    const repo = await this.inventoryOfRepos.find(repoId)
    const fileContent = await repo.fileContent(revision, location)
    return QueryResult.from(fileContent)
  }
}

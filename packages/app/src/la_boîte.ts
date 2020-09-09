import {
  Application,
  Author,
  BranchName,
  CommitMessage,
  DomainRule,
  Files,
  QueryResult,
  RemoteUrl,
  RepoId,
  RepoIndex,
  RepoSnapshot,
  SubscribesToDomainEvents,
} from 'git-en-boite-core'

export class LaBoîte implements Application {
  constructor(
    readonly repoIndex: RepoIndex,
    public readonly version: string,
    public readonly events: SubscribesToDomainEvents,
    rules: DomainRule[],
  ) {
    rules.map(rule => rule(events, this))
  }

  async commit(
    repoId: RepoId,
    branchName: BranchName,
    files: Files,
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

  async getInfo(repoId: RepoId): Promise<QueryResult<RepoSnapshot>> {
    if (!(await this.repoIndex.exists(repoId))) return QueryResult.from()
    const repo = await this.repoIndex.find(repoId)
    const branches = await repo.branches()
    return QueryResult.from(new RepoSnapshot(repoId, branches))
  }
}

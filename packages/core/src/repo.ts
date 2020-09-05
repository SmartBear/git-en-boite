import {
  Author,
  BranchSnapshot,
  BranchName,
  CommitMessage,
  Files,
  GitRepo,
  PendingCommitRef,
  RemoteUrl,
  RepoId,
} from '.'
import { DomainEventBus, RepoOriginSet } from './events'

export class Repo {
  constructor(
    public readonly repoId: RepoId,
    private readonly git: GitRepo,
    private readonly domainEvents: DomainEventBus,
  ) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
    this.domainEvents.emit('repo.origin-set', new RepoOriginSet(remoteUrl, this.repoId))
  }

  async branches(): Promise<BranchSnapshot[]> {
    const refs = await this.git.getRefs()
    return refs.reduce(
      (branches, ref) => (ref.isRemote ? branches.concat(ref.toBranch()) : branches),
      [],
    )
  }

  async commit(
    branchName: BranchName,
    files: Files,
    author: Author,
    message: CommitMessage,
  ): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    await this.git.commit(commitRef, files, author, message)
    await this.git.push(commitRef)
  }
}

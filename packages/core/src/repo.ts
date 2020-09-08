import {
  Author,
  BranchName,
  BranchSnapshot,
  CommitMessage,
  Files,
  GitRepo,
  PendingCommitRef,
  RemoteUrl,
  RepoId,
} from '.'
import { PublishesDomainEvents, RepoEvent } from './events'

export class Repo {
  constructor(
    public readonly repoId: RepoId,
    private readonly git: GitRepo,
    private readonly domainEvents: PublishesDomainEvents,
  ) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
    this.domainEvents.emit('repo.fetched', new RepoEvent(this.repoId))
  }

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
    this.domainEvents.emit('repo.connected', new RepoEvent(this.repoId))
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

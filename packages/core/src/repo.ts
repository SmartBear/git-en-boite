import {
  Author,
  BranchName,
  BranchSnapshot,
  CommitMessage,
  Files,
  FilePath,
  LocalClone,
  PendingCommitRef,
  PublishesDomainEvents,
  RemoteUrl,
  RepoConnected,
  RepoFetched,
  RepoFetchFailed,
  RepoId,
  CommitName,
  RepoReconnected,
} from '.'
import { FileContent } from './git_file'

export class Repo {
  constructor(
    public readonly repoId: RepoId,
    private readonly localClone: LocalClone,
    private readonly domainEvents: PublishesDomainEvents
  ) {}

  async fetch(): Promise<void> {
    await this.localClone
      .fetch()
      .then(() => this.domainEvents.emit('repo.fetched', new RepoFetched(this.repoId)))
      .catch((error) => {
        this.domainEvents.emit('repo.fetch-failed', new RepoFetchFailed(error, this.repoId))
        throw error
      })
  }

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    if (remoteUrl.equals(await this.localClone.getOrigin()))
      return this.domainEvents.emit('repo.reconnected', new RepoReconnected(this.repoId))
    await this.localClone.setOriginTo(remoteUrl)
    this.domainEvents.emit('repo.connected', new RepoConnected(this.repoId))
  }

  async branches(): Promise<BranchSnapshot[]> {
    const refs = await this.localClone.getRefs()
    return refs.reduce((branches, ref) => (ref.isRemote ? branches.concat(ref.toBranch()) : branches), [])
  }

  async commit(branchName: BranchName, files: Files, author: Author, message: CommitMessage): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    await this.localClone.commit(commitRef, files, author, message)
    await this.localClone.push(commitRef)
  }

  async fileContent(revision: CommitName, location: FilePath): Promise<FileContent> {
    const fileContent = await this.localClone.showFile(revision, location)
    return fileContent
  }
}

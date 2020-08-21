import {
  Author,
  Branch,
  BranchName,
  CommitMessage,
  Files,
  GitRepo,
  PendingCommitRef,
  RemoteUrl,
  RepoId,
} from '.'

export class Repo {
  constructor(public readonly repoId: RepoId, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
  }

  async branches(): Promise<Branch[]> {
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

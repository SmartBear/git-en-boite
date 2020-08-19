import { File, GitRepo, Branch, PendingCommitRef, BranchName, Author, RepoId } from '.'

export class Repo {
  constructor(public readonly repoId: RepoId, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: string): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
  }

  async branches(): Promise<Branch[]> {
    const refs = await this.git.getRefs()
    return refs.reduce(
      (branches, ref) => (ref.isRemote ? branches.concat(ref.toBranch()) : branches),
      [],
    )
  }

  async commit(branchName: BranchName, files: File[], author: Author): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    await this.git.commit(commitRef, files, author)
    await this.git.push(commitRef)
  }
}

import { File, GitRepo, Branch, PendingCommitRef } from '.'

export class Repo {
  constructor(public readonly repoId: string, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: string): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
  }

  async branches(): Promise<Branch[]> {
    const refs = await this.git.getRefs()
    return refs.filter(ref => ref.isRemote).map(ref => ref.toBranch())
  }

  async commit(branchName: string, file: File): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    await this.git.commit(commitRef, file)
    await this.git.push(commitRef)
  }
}

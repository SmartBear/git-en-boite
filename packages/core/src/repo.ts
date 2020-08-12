import { Ref, GitRepo, File } from '.'
import { PendingCommitRef } from './pending_commit_ref'

export class Repo {
  constructor(public readonly repoId: string, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: string): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
  }

  async getRefs(): Promise<Ref[]> {
    return await this.git.getRefs()
  }

  async commit(branchName: string, file: File): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    const refName = commitRef.localRef
    await this.git.commit(refName, branchName, file)
    await this.git.push(commitRef)
  }
}

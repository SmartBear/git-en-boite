import { File, GitRepo } from '.'
import { PendingCommitRef } from './pending_commit_ref'
import { Refs } from './refs'

export class Repo {
  constructor(public readonly repoId: string, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async setOriginTo(remoteUrl: string): Promise<void> {
    await this.git.setOriginTo(remoteUrl)
  }

  async getRefs(): Promise<Refs> {
    return await this.git.getRefs()
  }

  async commit(branchName: string, file: File): Promise<void> {
    const commitRef = PendingCommitRef.forBranch(branchName)
    await this.git.commit(commitRef, file)
    await this.git.push(commitRef)
  }
}

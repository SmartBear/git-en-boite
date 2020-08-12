import { Ref, GitRepo, File } from '.'
import { v4 as uuid } from 'uuid'

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
    const refName = `refs/pending-commits/${branchName}-${uuid()}`
    await this.git.commit(refName, branchName, file)
    await this.git.push(refName, branchName)
  }
}

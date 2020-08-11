import { Ref, GitRepo, File } from '.'

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
    await this.git.commit(branchName, file)
  }
}

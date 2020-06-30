import { Ref, GitRepo } from '.'

export class Repo {
  constructor(public readonly repoId: string, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async connect(remoteUrl: string): Promise<void> {
    await this.git.connect(remoteUrl)
  }

  public async getRefs(): Promise<Ref[]> {
    return await this.git.getRefs()
  }
}

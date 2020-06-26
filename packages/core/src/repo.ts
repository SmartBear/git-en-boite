import { Connect, Fetch, GetRefs, GitRepo } from 'git-en-boite-git-port'

import { Ref } from '.'

export class Repo {
  constructor(public readonly repoId: string, private readonly git: GitRepo) {}

  async fetch(): Promise<void> {
    await this.git(Fetch.fromOrigin())
  }

  async connect(remoteUrl: string): Promise<void> {
    await this.git(Connect.toUrl(remoteUrl))
  }

  public async getRefs(): Promise<Ref[]> {
    return await this.git(GetRefs.all())
  }
}

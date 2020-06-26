import { Connect, Fetch, GetRefs, GitRepo } from 'git-en-boite-git-port'

import { Ref } from '.'

export type RepoConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed'

export interface RepoProps {
  connectionStatus: RepoConnectionStatus
}

export class Repo implements RepoProps {
  public connectionStatus: RepoConnectionStatus

  constructor(
    public readonly repoId: string,
    private readonly git: GitRepo,
    { connectionStatus }: RepoProps = { connectionStatus: 'disconnected' },
  ) {
    this.connectionStatus = connectionStatus
  }

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

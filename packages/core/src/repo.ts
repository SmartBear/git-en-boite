import { Ref } from '.'
import { GitRepo, Fetch, Connect, GetRefs } from 'git-en-boite-git-port'
import { SingleRepoTaskScheduler } from 'git-en-boite-task-scheduler-port'

export type RepoConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed'

export class Repo {
  public connectionStatus: RepoConnectionStatus = 'disconnected'

  constructor(
    private readonly repoId: string,
    private readonly git: GitRepo,
    private readonly gitTasks: SingleRepoTaskScheduler,
  ) {}

  async fetch(): Promise<void> {
    await this.git(Fetch.fromOrigin())
  }

  async connect(remoteUrl: string): Promise<void> {
    this.connectionStatus = 'connecting'
    await this.git(Connect.toUrl(remoteUrl))
      .then(() => (this.connectionStatus = 'connected'))
      .catch(() => (this.connectionStatus = 'failed'))
  }

  public async getRefs(): Promise<Ref[]> {
    if (this.connectionStatus !== 'connected') return []
    return await this.git(GetRefs.all())
  }
}

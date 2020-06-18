import { Ref } from '.'
import { GitRepo, Fetch, Connect, GetRefs } from 'git-en-boite-git-port'
import { SingleRepoTaskScheduler } from 'git-en-boite-task-scheduler-port'

export class Repo {
  constructor(
    private readonly repoId: string,
    private readonly git: GitRepo,
    private readonly gitTasks: SingleRepoTaskScheduler,
  ) {}

  async fetch(): Promise<void> {
    await this.git(Fetch.fromOrigin())
  }

  async connect(remoteUrl: string): Promise<void> {
    this.gitTasks.schedule(Connect.toUrl(remoteUrl))
  }

  public async getRefs(): Promise<Ref[]> {
    return await this.git(GetRefs.all())
  }
}

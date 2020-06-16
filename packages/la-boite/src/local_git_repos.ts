import {
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  QueryResult,
  Application,
} from 'git-en-boite-client-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'
import { ConnectTask, FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'

export class LocalGitRepos implements Application {
  constructor(
    private readonly taskScheduler: RepoTaskScheduler,
    private readonly repoIndex: RepoIndex,
    public readonly version: string,
  ) {
    this.taskScheduler = taskScheduler
      .withProcessor('connect', async ({ repoId, remoteUrl }) => {
        const repo = await this.repoIndex.find(repoId)
        return repo.connect(remoteUrl)
      })
      .withProcessor('fetch', async ({ repoId }) => {
        const repo = await this.repoIndex.find(repoId)
        return repo.fetch()
      })
  }

  async close(): Promise<void> {
    await this.taskScheduler.close()
  }

  async waitUntilIdle(repoId: string): Promise<void> {
    return this.taskScheduler.waitUntilIdle(repoId)
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    await this.taskScheduler.schedule(repoId, new ConnectTask(remoteUrl))
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest): Promise<void> {
    this.taskScheduler.schedule(repoId, new FetchTask())
  }

  async getInfo(repoId: string): Promise<QueryResult<GitRepoInfo>> {
    if (!(await this.repoIndex.exists(repoId))) return QueryResult.from()
    const repo = await this.repoIndex.find(repoId)
    const refs = await repo.getRefs()
    const branches: Branch[] = refs
      .filter(ref => ref.isRemote)
      .map(ref => {
        return {
          name: ref.branchName,
          refName: ref.refName,
          revision: ref.revision,
        }
      })
    return QueryResult.from({ repoId, refs, branches })
  }
}

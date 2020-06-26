import {
  Application,
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  QueryResult,
} from 'git-en-boite-client-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'
import { FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'

export class LaBoîte implements Application {
  constructor(
    private readonly taskScheduler: RepoTaskScheduler,
    private readonly repoIndex: RepoIndex,
    public readonly version: string,
  ) {}

  async close(): Promise<void> {
    await this.taskScheduler.close()
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    const repo = await this.repoIndex.find(repoId)
    await repo.connect(remoteUrl)
    await this.repoIndex.save(repo)
  }

  async fetchFromRemote({ repoId }: FetchRepoRequest): Promise<void> {
    this.taskScheduler.schedule(repoId, new FetchTask())
    const repo = await this.repoIndex.find(repoId)
    await repo.fetch()
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
    return QueryResult.from({ repoId, refs, branches, ...repo })
  }
}

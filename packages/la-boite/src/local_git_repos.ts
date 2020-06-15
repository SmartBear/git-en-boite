import {
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  GitRepos,
  QueryResult,
} from 'git-en-boite-client-port'
import { BareRepoProtocol, OpensGitRepos } from 'git-en-boite-git-port'
import { ConnectTask, FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'
import { DiskRepoIndex } from 'git-en-boite-repo-index-adapter'

export class LocalGitRepos implements GitRepos {
  private readonly repoIndex: RepoIndex

  constructor(
    private readonly taskScheduler: RepoTaskScheduler,
    readonly basePath: string,
    readonly gitRepos: OpensGitRepos<BareRepoProtocol>,
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
    this.repoIndex = new DiskRepoIndex(basePath, gitRepos)
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

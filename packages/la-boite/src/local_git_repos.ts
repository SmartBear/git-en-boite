import fs from 'fs'
import {
  Branch,
  ConnectRepoRequest,
  FetchRepoRequest,
  GitRepoInfo,
  GitRepos,
  QueryResult,
} from 'git-en-boite-client-port'
import { Ref } from 'git-en-boite-core'
import {
  BareRepoProtocol,
  Connect,
  Fetch,
  GetRefs,
  GitRepo,
  OpensGitRepos,
} from 'git-en-boite-git-port'
import { ConnectTask, FetchTask, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'
import path from 'path'
import { TinyTypeOf } from 'tiny-types'

class RepoPath extends TinyTypeOf<string>() {
  static for(basePath: string, repoId: string): RepoPath {
    const folderName = Buffer.from(repoId).toString('hex')
    return new RepoPath(path.resolve(basePath, folderName))
  }
}

class Repo {
  constructor(private readonly repoId: string, private readonly git: GitRepo) {}

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

interface RepoIndex {
  exists(repoId: string): boolean
  find(repoId: string): Promise<Repo>
}

export class LocalGitRepos implements GitRepos, RepoIndex {
  private readonly repoIndex: RepoIndex

  constructor(
    private readonly basePath: string,
    private readonly taskScheduler: RepoTaskScheduler,
    private readonly gitRepos: OpensGitRepos<BareRepoProtocol>,
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
    this.repoIndex = this as RepoIndex
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
    if (!this.repoIndex.exists(repoId)) return QueryResult.from()
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

  async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.gitRepos.open(repoPath))
  }

  public exists(repoId: string): boolean {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

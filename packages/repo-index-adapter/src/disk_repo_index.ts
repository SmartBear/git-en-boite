import fs from 'fs'
import { Repo } from 'git-en-boite-core'
import { BareRepoProtocol, OpensGitRepos, RepoPath } from 'git-en-boite-git-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'
import { GitTasksFactory } from 'git-en-boite-task-scheduler-port'
import { string } from 'hamjest'

export class DiskRepoIndex implements RepoIndex {
  private readonly repos: Map<string, Repo> = new Map()
  constructor(
    private basePath: string,
    private gitRepos: OpensGitRepos<BareRepoProtocol>,
    private gitTasksFactory: GitTasksFactory,
  ) {}

  public async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    if (this.repos.has(repoId)) return this.repos.get(repoId)
    const repo = new Repo(
      repoId,
      await this.gitRepos.open(repoPath),
      this.gitTasksFactory.forRepo(repoId),
    )
    this.repos.set(repoId, repo)
    return repo
  }

  public async exists(repoId: string): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

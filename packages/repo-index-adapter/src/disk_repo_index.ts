import fs from 'fs'
import { Repo } from 'git-en-boite-core'
import { BareRepoProtocol, OpensGitRepos, RepoPath } from 'git-en-boite-git-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'
import { GitTasksFactory } from 'git-en-boite-task-scheduler-port'

export class DiskRepoIndex implements RepoIndex {
  constructor(
    private basePath: string,
    private gitRepos: OpensGitRepos<BareRepoProtocol>,
    private gitTasksFactory: GitTasksFactory,
  ) {}

  public async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(
      repoId,
      await this.gitRepos.open(repoPath),
      this.gitTasksFactory.forRepo(repoId),
    )
  }

  public async exists(repoId: string): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

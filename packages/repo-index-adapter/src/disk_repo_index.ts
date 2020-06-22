import fs from 'fs'
import { Repo, RepoProps } from 'git-en-boite-core'
import { BareRepoProtocol, OpensGitRepos, RepoPath } from 'git-en-boite-git-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'

export class DiskRepoIndex implements RepoIndex {
  private readonly repos: Map<string, RepoProps> = new Map()
  constructor(private basePath: string, private gitRepos: OpensGitRepos<BareRepoProtocol>) {}

  public async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    const repo = this.repos.has(repoId)
      ? new Repo(repoId, await this.gitRepos.open(repoPath), this.repos.get(repoId))
      : new Repo(repoId, await this.gitRepos.open(repoPath))
    return repo
  }

  public async save(repo: Repo): Promise<void> {
    this.repos.set(repo.repoId, repo)
  }

  public async exists(repoId: string): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

import fs from 'fs'
import {
  OpensGitRepos,
  PublishesDomainEvents,
  Repo,
  RepoId,
  RepoIndex,
  RepoPath,
} from 'git-en-boite-core'

export class DiskRepoIndex implements RepoIndex {
  constructor(
    private basePath: string,
    private gitRepos: OpensGitRepos,
    private domainEvents: PublishesDomainEvents,
  ) {}

  public async find(repoId: RepoId): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.gitRepos.openGitRepo(repoPath), this.domainEvents)
  }

  public async exists(repoId: RepoId): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

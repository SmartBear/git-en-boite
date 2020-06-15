import fs from 'fs'
import { Repo } from 'git-en-boite-core'
import { BareRepoProtocol, OpensGitRepos, RepoPath } from 'git-en-boite-git-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'

export class DiskRepoIndex implements RepoIndex {
  constructor(private basePath: string, private gitRepos: OpensGitRepos<BareRepoProtocol>) {}

  public async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.gitRepos.open(repoPath))
  }

  public async exists(repoId: string): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

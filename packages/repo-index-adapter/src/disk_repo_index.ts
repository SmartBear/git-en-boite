import fs from 'fs'
import { Repo, OpenGitRepo } from 'git-en-boite-core'
import { RepoPath } from 'git-en-boite-git-port'
import { RepoIndex } from 'git-en-boite-repo-index-port'

export class DiskRepoIndex implements RepoIndex {
  constructor(private basePath: string, private openGitRepo: OpenGitRepo) {}

  public async find(repoId: string): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.openGitRepo(repoPath))
  }

  public async exists(repoId: string): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

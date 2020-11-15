import fs from 'fs'
import {
  OpensLocalClones,
  PublishesDomainEvents,
  Repo,
  RepoId,
  InventoryOfRepos,
} from 'git-en-boite-core'
import { RepoPath } from './repo_path'

export class InventoryOfReposOnDisk implements InventoryOfRepos {
  constructor(
    private basePath: string,
    private localClones: OpensLocalClones,
    private domainEvents: PublishesDomainEvents,
  ) {}

  public async find(repoId: RepoId): Promise<Repo> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.localClones.openLocalClone(repoPath), this.domainEvents)
  }

  public async exists(repoId: RepoId): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

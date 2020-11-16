import fs from 'fs'
import {
  OpensLocalClones,
  PublishesDomainEvents,
  Repo,
  RepoId,
  InventoryOfRepos,
  NoSuchRepo,
  RepoAlreadyExists,
} from 'git-en-boite-core'
import { RepoPath } from './repo_path'

export class InventoryOfReposOnDisk implements InventoryOfRepos {
  constructor(
    private basePath: string,
    private localClones: OpensLocalClones,
    private domainEvents: PublishesDomainEvents,
  ) {}

  public async create(repoId: RepoId): Promise<Repo> {
    if (await this.exists(repoId))
      throw new RepoAlreadyExists('Repository already exists in the inventory', repoId)
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.localClones.createLocalClone(repoPath), this.domainEvents)
  }

  public async find(repoId: RepoId): Promise<Repo> {
    if (!(await this.exists(repoId))) throw new NoSuchRepo('No such repository', repoId)
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.localClones.openLocalClone(repoPath), this.domainEvents)
  }

  public async exists(repoId: RepoId): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return fs.existsSync(repoPath)
  }
}

import fs from 'fs'
import {
  LocalClones,
  PublishesDomainEvents,
  Repo,
  RepoId,
  InventoryOfRepos,
  NoSuchRepo,
  RepoAlreadyExists,
  Transaction,
} from 'git-en-boite-core'
import { RepoPath } from './repo_path'

export class InventoryOfReposOnDisk implements InventoryOfRepos {
  constructor(
    private basePath: string,
    private localClones: LocalClones,
    private domainEvents: PublishesDomainEvents,
  ) {}

  public async create(repoId: RepoId, transaction: Transaction<Repo>): Promise<void> {
    if (await this.exists(repoId)) throw RepoAlreadyExists.forRepoId(repoId)
    const repoPath = RepoPath.for(this.basePath, repoId).value
    const localClone = await this.localClones.createNew(repoPath)
    const repo = new Repo(repoId, localClone, this.domainEvents)
    await transaction(repo)
  }

  public async find(repoId: RepoId): Promise<Repo> {
    if (!(await this.exists(repoId))) throw NoSuchRepo.forRepoId(repoId)
    const repoPath = RepoPath.for(this.basePath, repoId).value
    return new Repo(repoId, await this.localClones.openExisting(repoPath), this.domainEvents)
  }

  public async exists(repoId: RepoId): Promise<boolean> {
    const repoPath = RepoPath.for(this.basePath, repoId).value
    // TODO: add #exists method to the LocalClones contract and delegate to that instead of using the filesystem
    return fs.existsSync(repoPath)
  }
}

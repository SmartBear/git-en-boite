import { DomainError, Repo, RepoId } from '.'

export class InventoryOfReposError extends DomainError {
  constructor(message: string, public readonly repoId: RepoId) {
    super(message)
  }
}

export class NoSuchRepo extends InventoryOfReposError {
  static forRepoId(repoId: RepoId): NoSuchRepo {
    return new NoSuchRepo('No such repository', repoId)
  }
}

export class RepoAlreadyExists extends InventoryOfReposError {
  static forRepoId(repoId: RepoId): RepoAlreadyExists {
    return new RepoAlreadyExists('Repository already exists in inventory', repoId)
  }
}

export interface InventoryOfRepos {
  create(repoId: RepoId): Promise<Repo>
  exists(repoId: RepoId): Promise<boolean>
  find(repoId: RepoId): Promise<Repo>
}

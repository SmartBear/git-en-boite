import { Repo, RepoId } from '.'

export interface InventoryOfRepos {
  create(repoId: RepoId): Promise<Repo>
  exists(repoId: RepoId): Promise<boolean>
  find(repoId: RepoId): Promise<Repo>
}

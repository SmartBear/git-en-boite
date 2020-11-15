import { Repo, RepoId } from '.'

export interface InventoryOfRepos {
  exists(repoId: RepoId): Promise<boolean>
  find(repoId: RepoId): Promise<Repo>
}

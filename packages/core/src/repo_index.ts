import { Repo, RepoId } from '.'

export interface RepoIndex {
  exists(repoId: RepoId): Promise<boolean>
  find(repoId: RepoId): Promise<Repo>
}

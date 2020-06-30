import { Repo } from '.'

export interface RepoIndex {
  exists(repoId: string): Promise<boolean>
  find(repoId: string): Promise<Repo>
}

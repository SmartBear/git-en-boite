import { Repo, RepoProps } from 'git-en-boite-core'

export interface RepoIndex {
  exists(repoId: string): Promise<boolean>
  find(repoId: string): Promise<Repo>
  save(repoProps: RepoProps): Promise<void>
}

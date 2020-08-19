import { Branch, RepoId } from '.'

export interface GitRepoInfo {
  repoId: RepoId
  branches: Branch[]
}

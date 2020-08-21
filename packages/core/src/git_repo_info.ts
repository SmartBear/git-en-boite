import { BranchSnapshot, RepoId } from '.'

export interface GitRepoInfo {
  repoId: RepoId
  branches: BranchSnapshot[]
}

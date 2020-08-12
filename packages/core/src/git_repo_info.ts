import { Branch } from './branch'

export interface GitRepoInfo {
  repoId: string
  branches: Branch[]
}

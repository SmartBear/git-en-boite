import { GitRepo } from './git_repo'

export interface GitRepos {
  findRepo: (repoId: string) => GitRepo
}

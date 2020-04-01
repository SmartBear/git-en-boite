import { GitRepos } from './git_repos'
import { GitRepo } from './git_repo'
import { LocalGitRepo } from './local_git_repo'

export class LocalGitRepos implements GitRepos {
  findRepo(repoId: string): GitRepo {
    return new LocalGitRepo()
  }
}

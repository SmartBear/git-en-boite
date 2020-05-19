import { OpensGitRepos, GitRepo } from 'git-en-boite-core-port-git'
import { LocalGitRepo } from './local_git_repo'

export class Factory implements OpensGitRepos {
  async open(path: string): Promise<GitRepo> {
    return await LocalGitRepo.openForCommands(path)
  }
}

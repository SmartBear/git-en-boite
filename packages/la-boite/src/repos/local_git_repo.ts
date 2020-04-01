import { GitRepo } from './git_repo'

export class LocalGitRepo implements GitRepo {
  get branches(): string[] {
    return ['master-todo']
  }
}

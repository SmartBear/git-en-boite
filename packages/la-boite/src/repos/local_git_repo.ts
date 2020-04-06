import { GitRepo } from './git_repo'

export class LocalGitRepo implements GitRepo {
  id: string

  constructor(id: string) {
    this.id = id
  }

  get branches(): string[] {
    return ['master-todo']
  }
}

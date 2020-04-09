import { GitRepo } from './git_repo'
import { Repository, Reference } from 'nodegit'

export class LocalGitRepo implements GitRepo {
  id: string
  path: string
  private repo: Promise<Repository>

  constructor(id: string, path: string) {
    this.id = id
    this.path = path
    this.repo = Repository.open(path)
  }

  async branches(): Promise<string[]> {
    const repo = await this.repo
    const refs = await repo.getReferences()
    return refs
      .filter(ref => ref.isBranch())
      .filter(ref => !ref.isRemote())
      .map(ref => ref.name())
      .map(refName => refName.split('/')[2])
  }
}

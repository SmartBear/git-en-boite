import { TinyType } from 'tiny-types'
import { CommitRef, RefName } from 'git-en-boite-core'

export class LocalCommitRef extends TinyType implements CommitRef {
  constructor(public readonly branchName: string, public readonly local: RefName) {
    super()
  }

  static forBranch(branchName: string): LocalCommitRef {
    const local = RefName.localBranch(branchName)
    return new LocalCommitRef(branchName, local)
  }

  get parent(): RefName {
    return RefName.localBranch(this.branchName)
  }
}

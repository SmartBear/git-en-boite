import { TinyType } from 'tiny-types'
import { CommitRef, RefName, BranchName } from 'git-en-boite-core'

export class LocalCommitRef extends TinyType implements CommitRef {
  constructor(public readonly branchName: BranchName, public readonly local: RefName) {
    super()
  }

  static forBranch(branchName: BranchName): LocalCommitRef {
    const local = RefName.localBranch(branchName)
    return new LocalCommitRef(branchName, local)
  }

  get parent(): RefName {
    return RefName.localBranch(BranchName.of(this.branchName.value))
  }
}

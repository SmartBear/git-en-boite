import { RefName, BranchSnapshot } from '.'
import { BranchName } from './branch_name'
import { CommitName } from './commit_name'

export class Ref {
  constructor(public readonly revision: CommitName, public readonly refName: RefName) {}

  get isRemote(): boolean {
    return !!this.refName.value.match('^refs/remotes/')
  }

  get branchName(): BranchName {
    return this.refName.branchName
  }

  toBranch(): BranchSnapshot {
    return new BranchSnapshot(this.branchName, this.revision)
  }
}

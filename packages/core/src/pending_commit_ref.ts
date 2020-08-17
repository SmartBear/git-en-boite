import { JSONObject, TinyType } from 'tiny-types'

import { PushableCommitRef, RefName } from '.'
import { BranchName } from '.'

export class PendingCommitRef extends TinyType implements PushableCommitRef {
  constructor(public readonly branchName: BranchName, public readonly local: RefName) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    return new PendingCommitRef(BranchName.of(branchName), RefName.forPendingCommit(branchName))
  }

  static fromJSON(o: JSONObject): PendingCommitRef {
    return new PendingCommitRef(
      BranchName.of(o.branchName as string),
      RefName.fromJSON(o.local as JSONObject),
    )
  }

  get remote(): RefName {
    return RefName.localBranch(this.branchName.value)
  }

  get parent(): RefName {
    return RefName.fetchedFromOrigin(this.branchName.value)
  }
}

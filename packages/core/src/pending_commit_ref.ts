import { Serialised, TinyType } from 'tiny-types'

import { PushableCommitRef, RefName } from '.'

export class PendingCommitRef extends TinyType implements PushableCommitRef {
  constructor(public readonly branchName: string, public readonly local: RefName) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    return new PendingCommitRef(branchName, RefName.forPendingCommit(branchName))
  }

  static fromJSON(parsedJSON: Serialised<PendingCommitRef>): PendingCommitRef {
    const { branchName, local } = parsedJSON as {
      branchName: string
      local: string
    }
    return new PendingCommitRef(branchName, RefName.fromRawString(local))
  }

  get remote(): RefName {
    return RefName.localBranch(this.branchName)
  }

  get parent(): RefName {
    return RefName.fetchedFromOrigin(this.branchName)
  }
}

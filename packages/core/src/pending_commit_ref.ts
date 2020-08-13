import { Serialised, TinyType } from 'tiny-types'
import { v4 as uuid } from 'uuid'

import { FetchedCommitRef, PushableCommitRef, RefName } from '.'

export class PendingCommitRef extends TinyType implements FetchedCommitRef, PushableCommitRef {
  constructor(public readonly branchName: string, public readonly local: RefName) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    return new PendingCommitRef(
      branchName,
      RefName.fromRawString(`refs/pending-commits/${branchName}-${uuid()}`),
    )
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

  get fetched(): RefName {
    return RefName.fetchedFromOrigin(this.branchName)
  }
}

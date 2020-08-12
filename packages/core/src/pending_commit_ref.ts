import { v4 as uuid } from 'uuid'
import { TinyTypeOf } from 'tiny-types'

export class PendingCommitRef extends TinyTypeOf<string>() {
  constructor(public readonly branchName: string) {
    super(`refs/pending-commits/${branchName}-${uuid()}`)
  }

  static forBranch(branchName: string): PendingCommitRef {
    return new PendingCommitRef(branchName)
  }
}

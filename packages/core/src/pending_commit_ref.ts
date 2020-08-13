import { v4 as uuid } from 'uuid'
import { TinyType, Serialised } from 'tiny-types'
import { PushableCommitRef } from '.'

export class PendingCommitRef extends TinyType implements PushableCommitRef {
  constructor(public readonly branchName: string, public readonly localRef: string) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    const localRef = `refs/pending-commits/${branchName}-${uuid()}`
    return new PendingCommitRef(branchName, localRef)
  }

  static fromJSON(parsedJSON: Serialised<PendingCommitRef>): PendingCommitRef {
    const { branchName, localRef } = parsedJSON as { branchName: string; localRef: string }
    return new PendingCommitRef(branchName, localRef)
  }

  get remoteRef(): string {
    return `refs/heads/${this.branchName}`
  }
}

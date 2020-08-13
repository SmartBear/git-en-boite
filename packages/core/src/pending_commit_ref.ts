import { v4 as uuid } from 'uuid'
import { TinyType, Serialised } from 'tiny-types'
import { PushableCommitRef } from '.'
import { CommitRef, FetchedCommitRef } from './commit_ref'

export class PendingCommitRef extends TinyType implements FetchedCommitRef, PushableCommitRef {
  constructor(public readonly branchName: string, public readonly local: string) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    const localRef = `refs/pending-commits/${branchName}-${uuid()}`
    return new PendingCommitRef(branchName, localRef)
  }

  static fromJSON(parsedJSON: Serialised<PendingCommitRef>): PendingCommitRef {
    const { branchName, local }: CommitRef = parsedJSON as {
      branchName: string
      local: string
    }
    return new PendingCommitRef(branchName, local)
  }

  get remote(): string {
    return `refs/heads/${this.branchName}`
  }

  get fetched(): string {
    return `refs/remotes/origin/${this.branchName}`
  }
}

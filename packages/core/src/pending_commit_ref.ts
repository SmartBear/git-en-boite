import { v4 as uuid } from 'uuid'
import { TinyType, TinyTypeOf, Serialised } from 'tiny-types'
import { PushableCommitRef } from '.'
import { CommitRef, FetchedCommitRef } from './commit_ref'

export class RefName extends TinyTypeOf<string>() {
  static ofOriginBranch(branchName: string): RefName {
    return new RefName(`refs/heads/${branchName}`)
  }

  toString(): string {
    return this.value
  }
}

export class PendingCommitRef extends TinyType implements FetchedCommitRef, PushableCommitRef {
  constructor(public readonly branchName: string, public readonly local: string) {
    super()
  }

  static forBranch(branchName: string): PendingCommitRef {
    return new PendingCommitRef(branchName, `refs/pending-commits/${branchName}-${uuid()}`)
  }

  static fromJSON(parsedJSON: Serialised<PendingCommitRef>): PendingCommitRef {
    const { branchName, local }: CommitRef = parsedJSON as {
      branchName: string
      local: string
    }
    return new PendingCommitRef(branchName, local)
  }

  get remote(): RefName {
    return RefName.ofOriginBranch(this.branchName)
  }

  get fetched(): string {
    return `refs/remotes/origin/${this.branchName}`
  }
}

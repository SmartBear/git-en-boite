import { TinyTypeOf } from 'tiny-types'
import { v4 as uuid } from 'uuid'

export class RefName extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static forPendingCommit(branchName: string): RefName {
    return new RefName(`refs/pending-commits/${branchName}-${uuid()}`)
  }

  static fetchedFromOrigin(branchName: string): RefName {
    return new RefName(`refs/remotes/origin/${branchName}`)
  }

  static localBranch(branchName: string): RefName {
    return new RefName(`refs/heads/${branchName}`)
  }

  static fromRawString(value: string): RefName {
    return new RefName(value)
  }

  toString(): string {
    return this.value
  }
}

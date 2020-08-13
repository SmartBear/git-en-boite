import { TinyTypeOf } from 'tiny-types'

export class RefName extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static fromRawString(value: string): RefName {
    return new RefName(value)
  }

  static fetchedFromOrigin(branchName: string): RefName {
    return new RefName(`refs/remotes/origin/${branchName}`)
  }

  static localBranch(branchName: string): RefName {
    return new RefName(`refs/heads/${branchName}`)
  }

  toString(): string {
    return this.value
  }
}

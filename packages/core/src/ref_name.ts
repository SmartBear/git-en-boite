import { TinyTypeOf } from 'tiny-types'

export class RefName extends TinyTypeOf<string>() {
  static ofOriginBranch(branchName: string): RefName {
    return new RefName(`refs/heads/${branchName}`)
  }

  toString(): string {
    return this.value
  }
}

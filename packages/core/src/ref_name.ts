import { TinyType } from 'tiny-types'
import { v4 as uuid } from 'uuid'

export class RefName extends TinyType {
  protected constructor(value: string, public readonly branchName: string) {
    super()
  }

  static forPendingCommit(branchName: string): RefName {
    return new RefName(`refs/pending-commits/${branchName}-${uuid()}`, branchName)
  }

  static fetchedFromOrigin(branchName: string): RefName {
    return new RefName(`refs/remotes/origin/${branchName}`, branchName)
  }

  static localBranch(branchName: string): RefName {
    return new RefName(`refs/heads/${branchName}`, branchName)
  }

  static fromRawString(value: string): RefName {
    const attempts: Array<[string, (branchName: string) => RefName]> = [
      ['^refs/heads/(.*)', RefName.localBranch],
    ]
    for (const [pattern, factory] of attempts) {
      const matches = value.match(pattern)
      if (matches) return factory(matches[1])
    }
    throw new Error(`Unable to parse ref from "${value}"`)
  }

  toString(): string {
    return this.value
  }
}

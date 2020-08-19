import { TinyType, JSONObject } from 'tiny-types'
import { v4 as uuid } from 'uuid'
import { BranchName } from '.'

const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export class RefName extends TinyType {
  protected constructor(public readonly value: string, public readonly branchName: BranchName) {
    super()
  }

  static forPendingCommit(branchName: BranchName): RefName {
    return new RefName(`refs/pending-commits/${branchName.value}-${uuid()}`, branchName)
  }

  static fetchedFromOrigin(branchName: BranchName): RefName {
    return new RefName(`refs/remotes/origin/${branchName.value}`, branchName)
  }

  static localBranch(branchName: BranchName): RefName {
    return new RefName(`refs/heads/${branchName.value}`, branchName)
  }

  static parse(value: string): RefName {
    const attempts: Array<[string, (branchName: BranchName) => RefName]> = [
      ['^refs/heads/(.+)', RefName.localBranch],
      [`^refs/pending-commits/(.+)-${uuidPattern}`, RefName.forPendingCommit],
      [`^refs/remotes/origin/(.+)`, RefName.fetchedFromOrigin],
    ]
    for (const [pattern, factory] of attempts) {
      const matches = value.match(pattern)
      if (matches) return factory(BranchName.of(matches[1]))
    }
    throw new Error(`Unable to parse ref from "${value}"`)
  }

  static fromJSON(o: JSONObject): RefName {
    return new RefName(o.value as string, BranchName.of(o.branchName as string))
  }

  toString(): string {
    return this.value
  }
}

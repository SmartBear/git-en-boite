import { JSONObject, JSONValue, TinyType } from 'tiny-types'

import { BranchName, CommitName } from '.'

export class BranchSnapshot extends TinyType {
  static fromJSON(json: JSONValue): BranchSnapshot {
    const branchName = BranchName.of((json as JSONObject).name as string)
    const revision = CommitName.of((json as JSONObject).revision as string)
    return new BranchSnapshot(branchName, revision)
  }

  constructor(public readonly name: BranchName, public readonly revision: CommitName) {
    super()
  }
}

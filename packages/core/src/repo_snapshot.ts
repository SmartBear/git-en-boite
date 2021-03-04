import { JSONArray, JSONObject, JSONValue, TinyType } from 'tiny-types'

import { BranchSnapshot, RepoId } from '.'

export class RepoSnapshot extends TinyType {
  static fromJSON(json: JSONValue): RepoSnapshot {
    const repoId = RepoId.fromJSON((json as JSONObject).repoId as string)
    const branches = ((json as JSONObject).branches as JSONArray).map((json) =>
      BranchSnapshot.fromJSON(json as JSONObject)
    )
    return new RepoSnapshot(repoId, branches)
  }

  constructor(public readonly repoId: RepoId, public readonly branches: BranchSnapshot[]) {
    super()
  }
}

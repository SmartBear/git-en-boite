import { assertThat, equalTo } from 'hamjest'
import { JSONObject } from 'tiny-types'

import { PendingCommitRef } from './pending_commit_ref'
import { RefName, BranchName } from '.'

describe(PendingCommitRef.name, () => {
  it('can be serialised/deserialized', () => {
    const original = PendingCommitRef.forBranch(BranchName.of('a-branch'))
    const copy = PendingCommitRef.fromJSON(original.toJSON() as JSONObject)
    assertThat(copy, equalTo(original))
  })

  it('has a remoteRef', () => {
    const ref = PendingCommitRef.forBranch(BranchName.of('a-branch'))
    assertThat(ref.remote, equalTo(RefName.parse('refs/heads/a-branch')))
  })

  it('has a fetched ref name', () => {
    const ref = PendingCommitRef.forBranch(BranchName.of('a-branch'))
    assertThat(ref.parent, equalTo(RefName.parse('refs/remotes/origin/a-branch')))
  })
})

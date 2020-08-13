import { assertThat, equalTo } from 'hamjest'

import { PendingCommitRef } from './pending_commit_ref'

describe(PendingCommitRef.name, () => {
  it('can be deserialized', () => {
    const original = PendingCommitRef.forBranch('a-branch')
    const copy = PendingCommitRef.fromJSON(original.toJSON())
    assertThat(copy, equalTo(original))
  })

  it('has a remoteRef', () => {
    const ref = PendingCommitRef.forBranch('a-branch')
    assertThat(ref.remote, equalTo('refs/heads/a-branch'))
  })
})

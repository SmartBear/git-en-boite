import { assertThat, equalTo } from 'hamjest'

import { PendingCommitRef } from './pending_commit_ref'
import { RefName } from '.'

describe(PendingCommitRef.name, () => {
  it('can be deserialized', () => {
    const original = PendingCommitRef.forBranch('a-branch')
    const copy = PendingCommitRef.fromJSON(original.toJSON())
    assertThat(copy, equalTo(original))
  })

  it('has a remoteRef', () => {
    const ref = PendingCommitRef.forBranch('a-branch')
    assertThat(ref.remote, equalTo(new RefName('refs/heads/a-branch')))
  })

  it('has a fetched ref name', () => {
    const ref = PendingCommitRef.forBranch('a-branch')
    assertThat(ref.fetched, equalTo(new RefName('refs/remotes/origin/a-branch')))
  })
})

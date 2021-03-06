import { Refs, CommitName } from '.'
import { Ref } from './ref'
import { RefName } from './ref_name'
import { equalTo, assertThat } from 'hamjest'
import { BranchName } from './branch_name'

describe(Refs.name, () => {
  it('filters by branchName', () => {
    const mainRef = new Ref(CommitName.of('1'), RefName.localBranch(BranchName.of('main')))
    const otherRef = new Ref(CommitName.of('2'), RefName.localBranch(BranchName.of('develop')))
    const refs = new Refs(mainRef, otherRef)
    assertThat(refs.forBranch(BranchName.of('main')), equalTo(mainRef))
  })
})

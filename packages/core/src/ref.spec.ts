import { assertThat, equalTo, truthy } from 'hamjest'

import { Ref } from './ref'
import { RefName } from './ref_name'
import { BranchName } from './branch_name'
import { CommitName } from '.'

describe(Ref.name, () => {
  describe('#isRemote', () => {
    context('for a remote branch', () => {
      let ref: Ref

      beforeEach(() => {
        ref = new Ref(CommitName.of('abcde1'), RefName.fetchedFromOrigin(BranchName.of('master')))
      })

      it('is true', () => {
        assertThat(ref.isRemote, truthy())
      })
    })
  })

  describe('#branchName', () => {
    context('for a remote branch', () => {
      let ref: Ref

      beforeEach(() => {
        ref = new Ref(CommitName.of('abcde1'), RefName.fetchedFromOrigin(BranchName.of('master')))
      })

      it('returns the name of the branch', () => {
        assertThat(ref.branchName, equalTo(BranchName.of('master')))
      })
    })
  })
})

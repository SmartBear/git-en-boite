import { Ref } from './ref'
import { assertThat, truthy, equalTo } from 'hamjest'
import { RefName } from './ref_name'

describe(Ref.name, () => {
  describe('#isRemote', () => {
    context('for a remote branch', () => {
      let ref: Ref

      beforeEach(() => {
        ref = new Ref('abcde1', new RefName('refs/remotes/origin/master'))
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
        ref = new Ref('abcde1', new RefName('refs/remotes/origin/master'))
      })

      it('returns the name of the branch', () => {
        assertThat(ref.branchName, equalTo('master'))
      })
    })
  })
})

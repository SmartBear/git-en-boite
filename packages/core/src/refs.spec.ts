import { Refs } from '.'
import { Ref } from './ref'
import { RefName } from './ref_name'
import { equalTo, assertThat } from 'hamjest'

describe(Refs.name, () => {
  it('@wip filters by branchName', () => {
    const mainRef = new Ref('1', RefName.localBranch('main'))
    const otherRef = new Ref('2', RefName.localBranch('develop'))
    const refs = new Refs(mainRef, otherRef)
    assertThat(refs.forBranch('main'), equalTo(mainRef))
  })
})

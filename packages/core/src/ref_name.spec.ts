import { RefName } from '.'
import { assertThat, equalTo } from 'hamjest'

describe(RefName.name, () => {
  context('@wip fromRawString', () => {
    it('works out the branchName for a local branch', () => {
      assertThat(RefName.fromRawString('refs/heads/main').branchName, equalTo('main'))
    })
  })
  it('@wip returns the branchName', () => {
    assertThat(RefName.fetchedFromOrigin('main').branchName, equalTo('main'))
  })
})

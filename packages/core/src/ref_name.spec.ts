import { assertThat, equalTo, hasProperty, matchesPattern, throws } from 'hamjest'
import { JSONObject } from 'tiny-types'

import { RefName } from '.'

describe(RefName.name, () => {
  context('parsing a raw string', () => {
    it('parses a local branch', () => {
      assertThat(RefName.parse(RefName.localBranch('main').value).branchName, equalTo('main'))
    })

    it('parses a pending commit ref', () => {
      assertThat(RefName.parse(RefName.forPendingCommit('main').value).branchName, equalTo('main'))
    })

    it('parses a fetched remote branch', () => {
      assertThat(RefName.parse(RefName.fetchedFromOrigin('main').value).branchName, equalTo('main'))
    })

    it('throws for an unrecognised string', () => {
      assertThat(
        () => RefName.parse('refs/blah/blah'),
        throws(hasProperty('message', matchesPattern('Unable to parse'))),
      )
    })
  })

  it('returns the branchName', () => {
    assertThat(RefName.fetchedFromOrigin('main').branchName, equalTo('main'))
  })

  it('can be serialized/deserialized', () => {
    const refName = RefName.forPendingCommit('main')
    assertThat(RefName.fromJSON(refName.toJSON() as JSONObject), equalTo(refName))
  })
})

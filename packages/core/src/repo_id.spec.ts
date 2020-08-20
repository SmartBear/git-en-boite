import { RepoId } from '.'
import { assertThat, equalTo, throws, matchesPattern, hasProperty } from 'hamjest'

describe(RepoId.name, () => {
  describe('creating from JSON', () => {
    it('works for a valid ID', () => {
      const value = 'valid.repo-id'
      const repoId = RepoId.fromJSON(value)
      assertThat(repoId.value, equalTo(value))
    })

    it('fails when the value is not a string', () => {
      assertThat(
        () => RepoId.fromJSON(5),
        throws(hasProperty('message', matchesPattern('should be a string'))),
      )
    })

    it('fails when the value contains slashes', () => {
      assertThat(
        () => RepoId.fromJSON('a/b'),
        throws(hasProperty('message', matchesPattern('should match pattern'))),
      )
    })
  })
})

import { RepoId } from '.'
import { assertThat, equalTo, throws, matchesPattern, hasProperty, not } from 'hamjest'

describe(RepoId.name, () => {
  describe('creating from JSON', () => {
    it('works for a valid ID', () => {
      const value = 'valid.repo-id'
      const repoId = RepoId.fromJSON(value)
      assertThat(repoId.value, equalTo(value))
    })

    it('fails when the value is not a string', () => {
      assertThat(() => RepoId.fromJSON(5), throws(hasProperty('message', matchesPattern('should be a string'))))
    })
  })

  describe('generating values', () => {
    it('generates unique values', () => {
      assertThat(RepoId.generate(), not(equalTo(RepoId.generate())))
    })
  })

  describe('encoding as a URL componenent', () => {
    it('escapes slashes', () => {
      assertThat(RepoId.of('one/two').urlEncode(), equalTo('one%2Ftwo'))
    })
  })
})

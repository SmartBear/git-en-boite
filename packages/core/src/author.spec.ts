import { assertThat, equalTo, hasProperty, matchesPattern, throws } from 'hamjest'

import { Author } from '.'

describe(Author.name, () => {
  describe('deserialising from JSON', () => {
    const name = 'Test Name'
    const email = 'user@example.com'

    it('works for a valid author', () => {
      const value = { name, email }
      const author = Author.fromJSON(value)
      assertThat(author.toJSON(), equalTo(value))
    })

    it('fails when the name is missing', () => {
      assertThat(
        () => Author.fromJSON({ email }),
        throws(hasProperty('message', matchesPattern('should have a property "name"')))
      )
    })
    it('fails when the email is missing', () => {
      assertThat(
        () => Author.fromJSON({ name }),
        throws(hasProperty('message', matchesPattern('should have a property "email"')))
      )
    })
  })
})

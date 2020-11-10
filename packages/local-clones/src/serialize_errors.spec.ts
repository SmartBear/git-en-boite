import { InvalidRepoUrl } from 'git-en-boite-core'
import { assertThat, hasProperty, equalTo, instanceOf } from 'hamjest'
import { deserialize } from './serialize_errors'
import { asSerializedError } from './serialize_errors'

describe('deserialize', () => {
  it('deserializes a serialized InvalidRepoUrl', () => {
    const invalidRepoUrl = new InvalidRepoUrl('Yikes')
    const serializedError = asSerializedError(invalidRepoUrl)
    const deserializedError = deserialize(serializedError)
    assertThat(deserializedError, hasProperty('message', equalTo('Yikes')))
    assertThat(deserializedError, instanceOf(InvalidRepoUrl))
  })

  it('deserializes a serialized Error', () => {
    const error = new Error('Yikes')
    const serializedError = asSerializedError(error)
    const deserializedError = deserialize(serializedError)
    assertThat(deserializedError, hasProperty('message', equalTo('Yikes')))
    assertThat(deserializedError, instanceOf(Error))
  })
})

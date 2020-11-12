import { InvalidRepoUrl, Logger } from 'git-en-boite-core'
import { assertThat, hasProperty, equalTo, instanceOf } from 'hamjest'
import { wasCalled, wasCalledWith } from 'hamjest-sinon'
import { stubInterface } from 'ts-sinon'
import { deserialize } from './serialize_errors'
import { asSerializedError } from './serialize_errors'

describe('deserialize', () => {
  const logger = stubInterface<Logger>()

  it('deserializes a serialized InvalidRepoUrl', () => {
    const invalidRepoUrl = new InvalidRepoUrl('Yikes')
    const serializedError = asSerializedError(invalidRepoUrl)
    const deserializedError = deserialize(serializedError, logger)
    assertThat(deserializedError, hasProperty('message', equalTo('Yikes')))
    assertThat(deserializedError, instanceOf(InvalidRepoUrl))
  })

  it('deserializes a serialized Error', () => {
    const error = new Error('Yikes')
    const serializedError = asSerializedError(error)
    const deserializedError = deserialize(serializedError, logger)
    assertThat(deserializedError, hasProperty('message', equalTo('Yikes')))
    assertThat(deserializedError, instanceOf(Error))
  })

  context('when given an instance of unknown error type', () => {
    class MyCustomError extends Error {
      constructor(message: string, public readonly someAttribute: string) {
        super(message)
      }
    }

    it('logs a warning', () => {
      const error = new MyCustomError('whoops', 'a-value')
      const serializedError = asSerializedError(error)
      deserialize(serializedError, logger)
      assertThat(logger.warn, wasCalled())
    })

    it('return an Error with the same props', () => {
      const error = new MyCustomError('whoops', 'a-value')
      const serializedError = asSerializedError(error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deserializedError = deserialize(serializedError, logger) as any
      assertThat(deserializedError, instanceOf(Error))
      assertThat(deserializedError.message, equalTo(error.message))
      assertThat(deserializedError.someAttribute, equalTo(error.someAttribute))
    })
  })
})

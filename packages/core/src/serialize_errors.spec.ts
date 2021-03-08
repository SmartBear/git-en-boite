import { InvalidRepoUrl, WriteLogEvent } from '.'
import { assertThat, equalTo, hasProperty, instanceOf } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'
import sinon from 'sinon'

import { asSerializedError, buildDeserializeError } from './serialize_errors'

const deserialize = buildDeserializeError(InvalidRepoUrl)

describe('deserialize', () => {
  let log: WriteLogEvent

  beforeEach(() => {
    log = sinon.stub()
  })

  it('deserializes a serialized InvalidRepoUrl', () => {
    const invalidRepoUrl = new InvalidRepoUrl('Yikes')
    const serializedError = asSerializedError(invalidRepoUrl)
    const deserializedError = deserialize(serializedError, log)
    assertThat(deserializedError, hasProperty('message', equalTo('Yikes')))
    assertThat(deserializedError, instanceOf(InvalidRepoUrl))
  })

  it('deserializes a serialized Error', () => {
    const error = new Error('Yikes')
    const serializedError = asSerializedError(error)
    const deserializedError = deserialize(serializedError, log)
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
      deserialize(serializedError, log)
      assertThat(log, wasCalledWith(hasProperty('level', 'warn')))
    })

    it('return an Error with the same props', () => {
      const error = new MyCustomError('whoops', 'a-value')
      const serializedError = asSerializedError(error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deserializedError = deserialize(serializedError, log) as any
      assertThat(deserializedError, instanceOf(Error))
      assertThat(deserializedError.message, equalTo(error.message))
      assertThat(deserializedError.someAttribute, equalTo(error.someAttribute))
    })
  })
})

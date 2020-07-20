import { assertThat, throws, hasProperty, equalTo, matchesPattern, not } from 'hamjest'
import {
  validateRepoId,
  checkForMissingRequestBodyContent,
  InvalidRepoIdError,
} from './intercept_request'

describe('validateRepoId', () => {
  it('does not throw InvalidRepoIdError when repoId is valid', async () =>
    assertThat(() => validateRepoId('valid.id'), not(throws())))

  it('throws InvalidRepoIdError when repoId is invalid', async () => {
    assertThat(
      () => validateRepoId('invalid/id'),
      throws(hasProperty('message', equalTo(InvalidRepoIdError.message))),
    )
  })
})

describe('checkForMissingRequestBodyContent', () => {
  it('does not throw an error when none of the expected parameters is missing', async () => {
    const received = { repoId: 'id', remoteUrl: 'url' }
    const expected = ['repoId', 'remoteUrl']

    assertThat(() => checkForMissingRequestBodyContent({ received, expected }), not(throws()))
  })

  it('throws when one of the expected parameters is missing', async () => {
    const received = {}
    const expected = ['repoId', 'remoteUrl']

    assertThat(
      () => checkForMissingRequestBodyContent({ received, expected }),
      throws(hasProperty('message', matchesPattern('Missing information from the request'))),
    )
  })
})

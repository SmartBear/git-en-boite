import { assertThat, throws, hasProperty, matchesPattern, not } from 'hamjest'
import { checkForMissingRequestBodyContent } from './validate_request'

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

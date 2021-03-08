import { assertThat, equalTo, hasProperty, instanceOf, throws } from 'hamjest'
import { JSONObject } from 'tiny-types'

import { AccessDenied, RepoId } from '.'
import { CannotDeserializeEvent, fromJSON, RepoConnected, RepoFetched, RepoFetchFailed, Timestamp } from './events'

describe('@wip DomainEvents', () => {
  describe('Converting from JSON', () => {
    context('with a bad payload', () => {
      it(`throws a ${CannotDeserializeEvent.name} error when there is no type`, () => {
        assertThat(() => fromJSON({}), throws(instanceOf(CannotDeserializeEvent)))
      })

      it('throws a useful error message', () => {
        assertThat(
          () => fromJSON({ what: 'ever' }),
          throws(hasProperty('message', equalTo('Cannot deserialize event from payload: {"what":"ever"}')))
        )
      })
    })

    it('works for a repo.fetched event', () => {
      const repoId = RepoId.generate()
      const event = new RepoFetched(repoId)
      assertThat(fromJSON(event.toJSON() as JSONObject), equalTo(event))
    })

    it('works for a repo.fetch-failed event', () => {
      const repoId = RepoId.generate()
      const event = new RepoFetchFailed(new Error('oops'), repoId)
      assertThat(fromJSON(event.toJSON() as JSONObject), equalTo(event))
    })

    it('works for a repo.fetch-failed event with a custom error', () => {
      const repoId = RepoId.generate()
      const event = new RepoFetchFailed(new AccessDenied('oops'), repoId)
      assertThat(fromJSON(event.toJSON() as JSONObject), hasProperty('error', instanceOf(AccessDenied)))
    })

    it('works for a repo.connected event', () => {
      const repoId = RepoId.generate()
      const event = new RepoConnected(repoId)
      assertThat(fromJSON(event.toJSON() as JSONObject), equalTo(event))
    })

    it('deserializes the timestamp correctly', async () => {
      const repoId = RepoId.generate()
      const event = new RepoConnected(repoId, new Timestamp(new Date(Date.now() - 100)))
      assertThat(fromJSON(event.toJSON() as JSONObject), equalTo(event))
    })
  })
})

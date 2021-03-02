import { EventEmitter } from 'events'
import { assertThat } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'
import sinon from 'sinon'
import { eventuallySync } from 'ts-eventually'
import { stubInterface } from 'ts-sinon'

import { fetchRepoAfterConnected } from '.'
import { Application, DomainEventBus, RepoConnected, RepoId } from '..'

describe(fetchRepoAfterConnected.name, () => {
  it('logs an error if the fetch fails', () => {
    const log = sinon.stub()
    const app = stubInterface<Application>()
    const domainEvents: DomainEventBus = new EventEmitter()
    fetchRepoAfterConnected(domainEvents, app, log)
    const error = new Error('a git error')
    app.fetchFromRemote.rejects(error)
    domainEvents.emit('repo.connected', new RepoConnected(RepoId.of('a-repo')))
    eventuallySync(() => {
      assertThat(log, wasCalledWith(error))
    })
  })
})

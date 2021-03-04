import { EventEmitter } from 'events'
import EventSource from 'eventsource'
import { Application, DomainEventBus, RepoConnected, RepoFetched, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, fulfilled, promiseThat } from 'hamjest'
import { Server } from 'http'
import fetch from 'node-fetch'
import { PassThrough } from 'stream'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../../create_web_app'
import router from '../../router'

describe('GET /repos/:repoId/events', () => {
  let server: Server
  let app: StubbedInstance<Application>
  const repoId = RepoId.fromJSON('a-repo')
  let domainEvents: DomainEventBus

  beforeEach(() => {
    app = stubInterface<Application>()
    app.events = domainEvents = new EventEmitter()
  })

  beforeEach(() => {
    const webApp = createWebApp(router(app), () => ({}))
    server = webApp.listen(8888)
  })

  afterEach(() => {
    server.close()
  })

  describe('emitting events about the repo', () => {
    let eventSource: EventSource

    afterEach(() => {
      eventSource.close()
    })

    it('only emits events about that repo', async () => {
      eventSource = new EventSource(`http://localhost:8888/repos/${repoId}/events`)

      eventSource.onopen = () => {
        domainEvents.emit('repo.connected', new RepoConnected(RepoId.fromJSON('another-repo')))
        domainEvents.emit('repo.connected', new RepoConnected(repoId))
      }

      const receivedEvent = await new Promise((resolve) => eventSource.addEventListener('repo.connected', resolve))
      assertThat(RepoId.fromJSON(JSON.parse((receivedEvent as MessageEvent).data).repoId), equalTo(repoId))
    })
  })

  describe('waiting for a particular event', () => {
    it('ends the request when that event occurs', async () => {
      const response = await fetch(`http://localhost:8888/repos/${repoId}/events?until=repo.fetched`)
      const body = response.body as PassThrough
      const waitingForRequestToEnd = new Promise((ended) => body.on('finish', ended))
      domainEvents.emit('repo.connected', new RepoConnected(repoId))
      domainEvents.emit('repo.fetched', new RepoFetched(repoId))
      await promiseThat(waitingForRequestToEnd, fulfilled())
    })
  })
})

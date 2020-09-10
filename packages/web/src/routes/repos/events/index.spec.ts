import { EventEmitter } from 'events'
import EventSource from 'eventsource'
import { Application, DomainEventBus, DomainEvents, RepoEvent, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, promiseThat, not, fulfilled } from 'hamjest'
import { Server } from 'http'
import fetch from 'node-fetch'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { PassThrough } from 'stream'

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
    const webApp = createWebApp(router(app))
    server = webApp.listen(8888)
  })

  afterEach(() => {
    server.close()
  })

  describe('emitting events about the repo', () => {
    let eventSource: EventSource

    beforeEach(() => {
      eventSource = new EventSource(`http://localhost:8888/repos/${repoId}/events`)
    })

    it('only emits events about that repo', async () => {
      await eventSourceIsReady()
      const waitingForAnEvent = new Promise<MessageEvent>(eventReceived => {
        for (const eventKey of DomainEvents.keys) {
          eventSource.addEventListener(eventKey, (event: Event) => {
            eventReceived(event as MessageEvent)
          })
        }
      })
      domainEvents.emit('repo.connected', new RepoEvent(RepoId.fromJSON('another-repo')))
      domainEvents.emit('repo.connected', new RepoEvent(repoId))
      const receivedEvent = await waitingForAnEvent
      assertThat(RepoId.fromJSON(JSON.parse(receivedEvent.data).repoId), equalTo(repoId))
    })

    it('emits a ready event', async () => {
      const receivedEvent = await new Promise<MessageEvent>(eventReceived =>
        eventSource.addEventListener('message', (event: Event) =>
          eventReceived(event as MessageEvent),
        ),
      )
      assertThat(receivedEvent.data, equalTo('ready'))
    })

    afterEach(() => {
      eventSource.close()
    })

    async function eventSourceIsReady() {
      while (!(eventSource.readyState === EventSource.OPEN)) {
        await new Promise(done => setTimeout(done, 1))
      }
    }
  })
  describe('@wip waiting for a particular event', () => {
    it('ends the request when that event occurs', async () => {
      const response = await fetch(
        `http://localhost:8888/repos/${repoId}/events?until=repo.fetched`,
      )
      const body = response.body as PassThrough
      const waitingForRequestToEnd = new Promise(ended => body.on('finish', ended))
      domainEvents.emit('repo.connected', new RepoEvent(repoId))
      domainEvents.emit('repo.fetched', new RepoEvent(repoId))
      await promiseThat(waitingForRequestToEnd, fulfilled())
    })
    it('redirects the request if given a redirect_to parameter')
  })
})

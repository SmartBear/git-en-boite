import { EventEmitter } from 'events'
import EventSource from 'eventsource'
import { Server } from 'http'
import { Application, DomainEventBus, DomainEvents, RepoEvent, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../../create_web_app'
import router from '../../router'

describe('GET /repos/:repoId/events', () => {
  let server: Server
  let app: StubbedInstance<Application>

  beforeEach(() => {
    app = stubInterface<Application>()
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

    it('only emits events about that repo', async () => {
      const domainEvents: DomainEventBus = new EventEmitter()
      app.events = domainEvents
      const repoId = RepoId.fromJSON('a-repo')
      eventSource = new EventSource(`http://localhost:8888/repos/${repoId}/events`)
      while (!(eventSource.readyState === EventSource.OPEN)) {
        await new Promise(done => setTimeout(done, 1))
      }

      const waitingForAnEvent = new Promise<MessageEvent>(eventReceived => {
        for (const eventKey of DomainEvents.keys) {
          eventSource.addEventListener(eventKey, (event: Event) => {
            eventReceived(event as MessageEvent)
          })
        }
      })
      domainEvents.emit('repo.connected', new RepoEvent(RepoId.fromJSON('another-repo')))
      domainEvents.emit('repo.connected', new RepoEvent(repoId))
      const receivedEvent: MessageEvent = await waitingForAnEvent
      assertThat(RepoId.fromJSON(JSON.parse(receivedEvent.data).repoId), equalTo(repoId))
    })

    afterEach(() => {
      eventSource.close()
    })
  })

  describe('waiting for a particular event', () => {
    it('ends the request when that event occurs')
    it('redirects the request if given a redirect_to parameter')
  })
})

import { EventEmitter } from 'events'
import EventSource from 'eventsource'
import { Application, DomainEventBus, RepoConnected, RepoFetched, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, fulfilled, promiseThat } from 'hamjest'
import { Server } from 'http'
import fetch from 'node-fetch'
import { PassThrough } from 'stream'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../create_web_app'
import router from '../router'

describe('GET /events', () => {
  let server: Server
  let app: StubbedInstance<Application>
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

  let eventSource: EventSource

  afterEach(() => {
    eventSource.close()
  })

  it('emits events about all repos', async () => {
    eventSource = new EventSource(`http://localhost:8888/events`)

    eventSource.onopen = () => {
      domainEvents.emit('repo.connected', new RepoConnected(RepoId.of('a-repo')))
      domainEvents.emit('repo.connected', new RepoConnected(RepoId.of('another-repo')))
    }
    const events = await new Promise<MessageEvent<string>[]>((resolve) => {
      const events: MessageEvent[] = []
      eventSource.addEventListener('repo.connected', (event: Event) => {
        events.push(event as MessageEvent<string>)
        if (events.length == 2) resolve(events)
      })
    })
    assertThat(
      events.map(({ data }) => JSON.parse(data).repoId),
      equalTo(['a-repo', 'another-repo'])
    )
  })

  describe('waiting for a particular event', () => {
    it('ends the request when a matching event occurs', async () => {
      const repoId = RepoId.of('a-repo')
      const response = await fetch(`http://localhost:8888/events?until=repo.fetched`)
      const body = response.body as PassThrough
      const waitingForRequestToEnd = new Promise((resolve) => body.on('finish', resolve))
      domainEvents.emit('repo.connected', new RepoConnected(repoId))
      domainEvents.emit('repo.fetched', new RepoFetched(RepoId.of('another-repo')))
      await promiseThat(waitingForRequestToEnd, fulfilled())
    })

    it('ends the request when a matching event occurs by entityId', async () => {
      const repoId = RepoId.of('a-repo')
      const response = await fetch(`http://localhost:8888/events?until=repo.fetched&entityId=a-repo`)
      const body = response.body as PassThrough
      const waitingForRequestToEnd = new Promise((resolve) => body.on('finish', resolve))
      domainEvents.emit('repo.connected', new RepoConnected(repoId))
      domainEvents.emit('repo.fetched', new RepoFetched(RepoId.of('another-repo')))
      domainEvents.emit('repo.fetched', new RepoFetched(repoId))
      await promiseThat(waitingForRequestToEnd, fulfilled())
    })
  })
})

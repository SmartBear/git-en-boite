import { createConfig } from 'git-en-boite-config'
import { DomainEventBus, RepoConnected, RepoFetched, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import EventEmitter from 'events'

import { GlobalDomainEventBus } from './GlobalDomainEventBus'

const config = createConfig()

describe(GlobalDomainEventBus.name, () => {
  describe('transmitting events', () => {
    it(`transmits an event to another instance of the ${GlobalDomainEventBus.name}`, async () => {
      const sender = await GlobalDomainEventBus.connect(config.redis)
      const receiver = await GlobalDomainEventBus.connect(config.redis)
      const receiving = new Promise((resolve) => receiver.on('repo.connected', resolve))
      const event = new RepoConnected(RepoId.generate())
      sender.emit('repo.connected', event)
      const actual = await receiving
      assertThat(actual, equalTo(event))
      sender.close()
      receiver.close()
    })

    it('transmits the same event to a multiple listeners on the same receiver', async () => {
      const sender = await GlobalDomainEventBus.connect(config.redis)
      const receiver = await GlobalDomainEventBus.connect(config.redis)
      const receivingOne = new Promise((resolve) => receiver.on('repo.connected', resolve))
      const receivingTwo = new Promise((resolve) => receiver.on('repo.connected', resolve))
      const event = new RepoConnected(RepoId.generate())
      sender.emit('repo.connected', event)
      const actualOne = await receivingOne
      const actualTwo = await receivingTwo
      assertThat(actualOne, equalTo(event))
      assertThat(actualTwo, equalTo(event))
      sender.close()
      receiver.close()
    })

    it('transmits the same event to a multiple receivers', async () => {
      const sender = await GlobalDomainEventBus.connect(config.redis)
      const receiverOne = await GlobalDomainEventBus.connect(config.redis)
      const receiverTwo = await GlobalDomainEventBus.connect(config.redis)
      const receivingOne = new Promise((resolve) => receiverOne.on('repo.connected', resolve))
      const receivingTwo = new Promise((resolve) => receiverTwo.on('repo.connected', resolve))
      const event = new RepoConnected(RepoId.generate())
      sender.emit('repo.connected', event)
      const actualOne = await receivingOne
      const actualTwo = await receivingTwo
      assertThat(actualOne, equalTo(event))
      assertThat(actualTwo, equalTo(event))
      sender.close()
      receiverOne.close()
      receiverTwo.close()
    })

    it('transmits different events to different receivers', async () => {
      const sender = await GlobalDomainEventBus.connect(config.redis)
      const receiverOne = await GlobalDomainEventBus.connect(config.redis)
      const receiverTwo = await GlobalDomainEventBus.connect(config.redis)
      const receivingOne = new Promise((resolve) => receiverOne.on('repo.connected', resolve))
      const receivingTwo = new Promise((resolve) => receiverTwo.on('repo.fetched', resolve))
      const repoConnected = new RepoConnected(RepoId.generate())
      const repoFetched = new RepoFetched(RepoId.generate())
      sender.emit('repo.connected', repoConnected)
      sender.emit('repo.fetched', repoFetched)
      const actualOne = await receivingOne
      const actualTwo = await receivingTwo
      assertThat(actualOne, equalTo(repoConnected))
      assertThat(actualTwo, equalTo(repoFetched))
      sender.close()
      receiverOne.close()
      receiverTwo.close()
    })
  })

  describe('connecting to another EventBus', () => {
    it('emits an event sent to the other EventBus', async () => {
      const localEventBus: DomainEventBus = new EventEmitter()
      const globalEventBus = (await GlobalDomainEventBus.connect(config.redis)).listenTo(localEventBus)
      const receiving = new Promise((resolve) => globalEventBus.on('repo.connected', resolve))
      const event = new RepoConnected(RepoId.generate())
      localEventBus.emit('repo.connected', event)
      const actual = await receiving
      assertThat(actual, equalTo(event))
      globalEventBus.close()
    })
  })
})

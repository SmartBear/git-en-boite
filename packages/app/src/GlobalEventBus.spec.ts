import { createConfig } from 'git-en-boite-config'
import { RepoConnected, RepoFetched, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'

import { GlobalEventBus } from './GlobalEventBus'

const config = createConfig()

describe(GlobalEventBus.name, () => {
  it('transmits an event to a single receiver', async () => {
    const sender = await GlobalEventBus.connect(config.redis)
    const receiver = await GlobalEventBus.connect(config.redis)
    const receiving = new Promise((resolve) => receiver.on('repo.connected', resolve))
    const event = new RepoConnected(RepoId.generate())
    sender.emit('repo.connected', event)
    const actual = await receiving
    assertThat(actual, equalTo(event))
    sender.close()
    receiver.close()
  })

  it('transmits the same event to a multiple listeners on the same receiver', async () => {
    const sender = await GlobalEventBus.connect(config.redis)
    const receiver = await GlobalEventBus.connect(config.redis)
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
    const sender = await GlobalEventBus.connect(config.redis)
    const receiverOne = await GlobalEventBus.connect(config.redis)
    const receiverTwo = await GlobalEventBus.connect(config.redis)
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
    const sender = await GlobalEventBus.connect(config.redis)
    const receiverOne = await GlobalEventBus.connect(config.redis)
    const receiverTwo = await GlobalEventBus.connect(config.redis)
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

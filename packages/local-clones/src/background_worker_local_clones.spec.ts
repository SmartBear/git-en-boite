import { equal } from 'assert'
import { createConfig } from 'git-en-boite-config'
import { RemoteUrl, WriteLogEvent } from 'git-en-boite-core'
import {
  anything,
  assertThat,
  contains,
  equalTo,
  fulfilled,
  hasProperties,
  hasProperty,
  matchesPattern,
  promiseThat,
  rejected,
} from 'hamjest'
import { wasCalledInOrder } from 'hamjest-sinon'
import { nanoid } from 'nanoid'
import path from 'path'
import sinon from 'sinon'
import { dirSync } from 'tmp'

import { BackgroundWorkerLocalClones, createBareRepo, DirectLocalClone } from '.'
import { verifyLocalCloneContract } from './contracts/verifyLocalCloneContract'
import { verifyLocalClonesContract } from './contracts/verifyLocalClonesContract'

const config = createConfig()

describe(BackgroundWorkerLocalClones.name, () => {
  let log: WriteLogEvent

  beforeEach(() => {
    log = sinon.stub()
  })

  context('when a worker is running', () => {
    let localClones: BackgroundWorkerLocalClones

    beforeEach(async function () {
      const queueName = nanoid()
      localClones = await BackgroundWorkerLocalClones.connect(
        DirectLocalClone,
        config.redis,
        queueName,
        log,
      )
      await localClones.startWorker(log)
    })
    afterEach(async () => await localClones.close())

    verifyLocalClonesContract(() => localClones)
    verifyLocalCloneContract(() => localClones)

    it('logs each git operation', async () => {
      const root = dirSync().name
      const originUrl = RemoteUrl.of(path.resolve(root, 'origin'))
      await createBareRepo(originUrl.value)
      await localClones.pingWorkers()
      const git = await localClones.createNew(path.resolve(root, 'repo'))
      await git.setOriginTo(originUrl)
      assertThat(
        log,
        wasCalledInOrder(
          [{ message: 'received: ping', level: 'info', job: { name: 'ping', data: {} } }],
          contains(
            hasProperties({
              message: equalTo('received: setOriginTo'),
            }),
          ),
        ),
      )
    })
  })

  context('checking for running workers', () => {
    let localClones: BackgroundWorkerLocalClones

    beforeEach(async function () {
      const queueName = nanoid()
      localClones = await BackgroundWorkerLocalClones.connect(
        DirectLocalClone,
        config.redis,
        queueName,
        log,
      )
    })

    afterEach(async () => {
      await localClones.close()
    })

    it('throws an error when no workers are running', async () => {
      const pinging = localClones.pingWorkers(1)
      await promiseThat(
        pinging,
        rejected(hasProperty('message', matchesPattern('No workers responded'))),
      )
    })

    it('succeeds when a worker is running', async () => {
      await localClones.startWorker(() => ({}))
      const pinging = localClones.pingWorkers(100)
      await promiseThat(pinging, fulfilled())
    })
  })

  context('connecting', () => {
    it('throws an error if the redis connection cannot be established', async () => {
      const badRedisOptions = 'redis://localhost:1234'
      const connecting = BackgroundWorkerLocalClones.connect(
        DirectLocalClone,
        badRedisOptions,
        'a-queue',
        log,
      )
      await promiseThat(connecting, rejected())
    })
  })
})

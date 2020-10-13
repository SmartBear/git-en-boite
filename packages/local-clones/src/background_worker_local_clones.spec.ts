import { createConfig } from 'git-en-boite-config'
import { Logger, RemoteUrl } from 'git-en-boite-core'
import {
  assertThat,
  equalTo,
  fulfilled,
  hasProperty,
  matchesPattern,
  promiseThat,
  rejected,
} from 'hamjest'
import { wasCalled, wasCalledWith } from 'hamjest-sinon'
import path from 'path'
import { dirSync } from 'tmp'
import { stubInterface } from 'ts-sinon'

import { BackgroundWorkerLocalClones, createBareRepo, openBareRepo } from '.'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DirectLocalClone } from '.'

const config = createConfig()

describe(BackgroundWorkerLocalClones.name, () => {
  context('when a worker is running', () => {
    let localClones: BackgroundWorkerLocalClones
    const logger = stubInterface<Logger>()

    before(async function () {
      localClones = await BackgroundWorkerLocalClones.connect(DirectLocalClone, config.redis)
      await localClones.startWorker(logger)
    })
    after(async () => await localClones.close())

    const openLocalClone = (path: string) => localClones.openLocalClone(path)

    verifyRepoFactoryContract(openLocalClone, openBareRepo)
    verifyRepoContract(openLocalClone)

    it('logs each git operation', async () => {
      const root = dirSync().name
      const originUrl = RemoteUrl.of(path.resolve(root, 'origin'))
      await createBareRepo(originUrl.value)
      await localClones.pingWorkers()
      const git = await localClones.openLocalClone(path.resolve(root, 'repo'))
      await git.setOriginTo(originUrl)
      assertThat(logger.log, wasCalled())
      assertThat(logger.log, wasCalledWith(hasProperty('name', matchesPattern('setOrigin'))))
      assertThat(
        logger.log,
        wasCalledWith(hasProperty('data', hasProperty('remoteUrl', equalTo(originUrl.value)))),
      )
    })
  })

  context('checking for running workers', () => {
    let localClones: BackgroundWorkerLocalClones

    beforeEach(async function () {
      localClones = await BackgroundWorkerLocalClones.connect(DirectLocalClone, config.redis)
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
      await localClones.startWorker(Logger.none)
      const pinging = localClones.pingWorkers(100)
      await promiseThat(pinging, fulfilled())
    })
  })

  context('connecting', () => {
    it('throws an error if the redis connection cannot be established', async () => {
      const badRedisOptions = 'redis://localhost:1234'
      const connecting = BackgroundWorkerLocalClones.connect(DirectLocalClone, badRedisOptions)
      await promiseThat(connecting, rejected())
    })
  })
})
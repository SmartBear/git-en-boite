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

import { createBareRepo, openBareRepo } from './'
import { BackgroundGitRepos } from './background_git_repos'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BackgroundGitRepos.name, () => {
  context('when a worker is running', () => {
    let gitRepos: BackgroundGitRepos
    const logger = stubInterface<Logger>()

    before(async function () {
      gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
      await gitRepos.startWorker(logger)
    })
    after(async () => await gitRepos.close())

    const openRepo = (path: string) => gitRepos.openGitRepo(path)

    verifyRepoFactoryContract(openRepo, openBareRepo)
    verifyRepoContract(openRepo)

    it('logs each git operation', async () => {
      const root = dirSync().name
      const originUrl = RemoteUrl.of(path.resolve(root, 'origin'))
      await createBareRepo(originUrl.value)
      await gitRepos.pingWorkers()
      const git = await gitRepos.openGitRepo(path.resolve(root, 'repo'))
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
    let gitRepos: BackgroundGitRepos

    beforeEach(async function () {
      gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
    })

    afterEach(async () => {
      await gitRepos.close()
    })

    it('throws an error when no workers are running', async () => {
      const pinging = gitRepos.pingWorkers(1)
      await promiseThat(
        pinging,
        rejected(hasProperty('message', matchesPattern('No workers responded'))),
      )
    })

    it('succeeds when a worker is running', async () => {
      await gitRepos.startWorker(Logger.none)
      const pinging = gitRepos.pingWorkers(100)
      await promiseThat(pinging, fulfilled())
    })
  })

  context('connecting', () => {
    it('throws an error if the redis connection cannot be established', async () => {
      const badRedisOptions = 'redis://localhost:1234'
      const connecting = BackgroundGitRepos.connect(DugiteGitRepo, badRedisOptions)
      await promiseThat(connecting, rejected())
    })
  })
})

import { createConfig } from 'git-en-boite-config'
import { promiseThat, rejected, fulfilled } from 'hamjest'

import { BareRepoFactory, NonBareRepoFactory } from './'
import { BackgroundGitRepos, BackgroundGitRepoProxy } from './background_git_repos'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BackgroundGitRepos.name, () => {
  context('when a worker is running', () => {
    let gitRepos: BackgroundGitRepos
    before(async function () {
      gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
      await gitRepos.startWorker()
    })
    after(async () => await gitRepos.close())

    const openRepo = (path: string) => gitRepos.openGitRepo(path)

    const bareRepoFactory = new BareRepoFactory()
    const nonBareRepoFactory = new NonBareRepoFactory()
    verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
    verifyRepoContract(openRepo, nonBareRepoFactory.open)
  })

  context('checking for running workers', () => {
    let gitRepos: BackgroundGitRepos
    beforeEach(async function () {
      gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
    })
    afterEach(async () => await gitRepos.close())

    it('throws an error when no workers are running', async () => {
      const pinging = gitRepos.pingWorkers(1)
      await promiseThat(pinging, rejected())
    })

    // Skipping because having both of these seems to leave a hanging promise
    it.skip('succeeds when a worker is running', async () => {
      await gitRepos.startWorker()
      const pinging = gitRepos.pingWorkers()
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

import { createConfig } from 'git-en-boite-config'

import { BareRepoFactory, NonBareRepoFactory } from '.'
import { BullGitRepo, BullGitRepoFactory } from './bull_git_repo'
import { BullGitRepoWorker } from './bull_git_repo_worker'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BullGitRepo.name, () => {
  const repoFactory = new BullGitRepoFactory(DugiteGitRepo.open, config.redis)
  after(() => repoFactory.close())

  const openRepo = (path: string) => repoFactory.open(path)

  const bareRepoFactory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
  verifyRepoContract(openRepo, nonBareRepoFactory.open)

  let worker: BullGitRepoWorker
  beforeEach(async () => {
    worker = await BullGitRepoWorker.start(config.redis, DugiteGitRepo.open)
  })
  afterEach(() => worker.close())
})

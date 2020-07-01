import { createConfig } from 'git-en-boite-config'
import { dirSync } from 'tmp'

import { BareRepoFactory, NonBareRepoFactory } from '.'
import { BullGitRepo } from './bull_git_repo'
import { BullGitRepoWorker } from './bull_git_repo_worker'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BullGitRepo.name, () => {
  const openRepo = BullGitRepo.open(DugiteGitRepo.open, config.redis)
  const bareRepoFactory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
  verifyRepoContract(openRepo, nonBareRepoFactory.open)

  let worker: BullGitRepoWorker
  beforeEach(async () => {
    worker = await BullGitRepoWorker.open(config.redis, DugiteGitRepo.open)
  })
  afterEach(() => worker.close())
})

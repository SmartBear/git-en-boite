import { dirSync } from 'tmp'

import { BareRepoFactory, NonBareRepoFactory } from '.'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { BullGitRepo } from './bull_git_repo'
import { BullGitRepoWorker } from './bull_git_repo_worker'

describe(BullGitRepo.name, () => {
  const openRepo = BullGitRepo.open
  const bareRepoFactory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
  verifyRepoContract(openRepo, nonBareRepoFactory.open)

  let root: string
  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  let worker: BullGitRepoWorker
  beforeEach(async () => {
    worker = await BullGitRepoWorker.open()
  })
  afterEach(async () => {
    await worker.close()
  })
})

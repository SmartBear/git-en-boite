import { verifyRepoFactoryContract } from 'git-en-boite-git-port'
import { dirSync } from 'tmp'

import { BareRepoFactory, NonBareRepoFactory } from '.'
import { DugiteGitRepo } from './dugite_git_repo'
import { verifyRepoContract } from 'git-en-boite-git-port/src/verify_repo_factory_contract'

describe(DugiteGitRepo.name, () => {
  const openRepo = DugiteGitRepo.open
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
})

import { dirSync } from 'tmp'

import { RepoFactory } from '.'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

describe(DugiteGitRepo.name, () => {
  const openRepo = DugiteGitRepo.openGitRepo
  const repoFactory = new RepoFactory()
  verifyRepoFactoryContract(openRepo, repoFactory.open)
  verifyRepoContract(openRepo, repoFactory.open)

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })
})

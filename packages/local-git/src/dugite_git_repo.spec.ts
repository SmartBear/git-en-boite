import { dirSync } from 'tmp'

import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'
import { dispatchToRepo } from './dispatch_to_repo'

describe(DugiteGitRepo.name, () => {
  const openRepo = DugiteGitRepo.openGitRepo
  verifyRepoFactoryContract(openRepo, dispatchToRepo)
  verifyRepoContract(openRepo, dispatchToRepo)

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })
})

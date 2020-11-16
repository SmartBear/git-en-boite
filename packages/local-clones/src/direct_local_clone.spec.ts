import { dirSync } from 'tmp'

import { openBareRepo } from './bare_repo'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DirectLocalClone } from '.'

describe(DirectLocalClone.name, () => {
  const createLocalClone = DirectLocalClone.createLocalClone
  verifyRepoFactoryContract(() => DirectLocalClone, openBareRepo)
  verifyRepoContract(createLocalClone)

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })
})

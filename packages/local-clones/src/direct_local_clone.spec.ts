import { dirSync } from 'tmp'

import { verifyLocalCloneContract } from './contracts/verifyLocalCloneContract'
import { verifyLocalClonesContract } from './contracts/verifyLocalClonesContract'
import { DirectLocalClones } from '.'

describe(DirectLocalClones.name, () => {
  verifyLocalClonesContract(() => new DirectLocalClones())
  verifyLocalCloneContract(() => new DirectLocalClones())

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })
})

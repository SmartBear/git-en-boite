import { Dispatch } from 'git-en-boite-command-bus'
import {
  Commit,
  Connect,
  GetRefs,
  Init,
  verifyRepoFactoryContract,
  NonBareRepoProtocol,
} from 'git-en-boite-git-port'
import { fulfilled, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { NonBareRepoFactory, BareRepoFactory } from '.'

describe(BareRepoFactory.name, () => {
  const factory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(factory, nonBareRepoFactory)

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe(Connect.name, () => {
    let remoteUrl: string
    let origin: Dispatch<NonBareRepoProtocol>

    beforeEach(async () => {
      remoteUrl = path.resolve(root, 'remote', 'a-repo-id')
      origin = await nonBareRepoFactory.open(remoteUrl)
      await origin(Commit.withAnyMessage())
    })

    it('creates a new repo', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = await factory.open(repoPath)
      await git(Connect.toUrl(remoteUrl))
      await promiseThat(git(GetRefs.all()), fulfilled())
    })
  })
})

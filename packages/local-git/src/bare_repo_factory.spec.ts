import { Dispatch } from 'git-en-boite-message-dispatch'
import { fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { BareRepoFactory } from '.'
import { Commit, Connect, BareRepoProtocol } from './operations'

describe(BareRepoFactory.name, () => {
  const factory = new BareRepoFactory()

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe(Connect.name, () => {
    let remoteUrl: string
    let origin: Dispatch<BareRepoProtocol>
    let git: Dispatch<BareRepoProtocol>
    let repoPath: string

    beforeEach(async () => {
      remoteUrl = path.resolve(root, 'remote', 'a-repo-id')
      origin = await factory.open(remoteUrl)
      await origin(Commit.withAnyMessage())

      repoPath = path.resolve(root, 'a-repo-id')
      git = await factory.open(repoPath)
    })

    it('connects to a valid remote', async () => {
      await promiseThat(git(Connect.toUrl(remoteUrl)), fulfilled())
    })

    it('fails with a bad remote', async () => {
      await promiseThat(git(Connect.toUrl('a-bad-url')), rejected())
    })
  })
})

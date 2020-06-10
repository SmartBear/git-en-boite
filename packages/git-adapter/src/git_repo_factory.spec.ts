import { Dispatch } from 'git-en-boite-command-bus'
import {
  Commit,
  Connect,
  GetRefs,
  Init,
  verifyRepoFactoryContract,
  TestableGitRepoProtocol,
} from 'git-en-boite-git-port'
import { fulfilled, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { TestableGitRepoFactory } from '.'
import { GitRepoFactory } from './git_repo_factory'

describe(GitRepoFactory.name, () => {
  const factory = new GitRepoFactory()
  verifyRepoFactoryContract(factory, new TestableGitRepoFactory())

  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe(Connect.name, () => {
    let remoteUrl: string
    let origin: Dispatch<TestableGitRepoProtocol>

    beforeEach(async () => {
      remoteUrl = path.resolve(root, 'remote', 'a-repo-id')
      origin = await new TestableGitRepoFactory().open(remoteUrl)
      await origin(Init.normalRepo())
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

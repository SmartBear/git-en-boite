import { OpenGitRepo } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GetConfig, RepoProtocol } from '..'
import { Dispatch } from 'git-en-boite-message-dispatch'

type OpenBareRepo = (path: string) => Promise<Dispatch<RepoProtocol>>

export const verifyRepoFactoryContract = (
  openGitRepo: OpenGitRepo,
  openBareRepo: OpenBareRepo,
): void => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('opening a repo path', () => {
    context('when the directory does not exist', () => {
      it('creates an initialised repo', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        await openGitRepo(repoPath)
        const git = await openBareRepo(repoPath)
        const config = await git(GetConfig.forRepo())
        await assertThat(config['user.name'], equalTo('Git en boîte'))
      })
    })

    context('when there is already a repo in the directory', () => {
      it('opens the existing repo')
    })
  })
}

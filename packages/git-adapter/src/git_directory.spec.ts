import fs from 'fs'
import { assertThat, hasProperty, matchesPattern, promiseThat, rejected, startsWith } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from './git_directory'

describe(GitDirectory.name, () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('running arbitrary git commands', () => {
    it('returns a promise of the result', async () => {
      const repoPath = path.resolve(root, 'a-repo')
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitDirectory(repoPath)
      const result = await repo.execGit('init')
      assertThat(result.stdout, startsWith('Initialized empty Git repository'))
    })

    it('raises any error', async () => {
      const repoPath = path.resolve(root, 'a-repo')
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitDirectory(repoPath)
      await promiseThat(
        repo.execGit('not-a-command'),
        rejected(hasProperty('message', matchesPattern('is not a git command'))),
      )
    })

    it('passes args')

    it('passes options')
  })
})

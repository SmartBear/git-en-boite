import fs from 'fs'
import childProcess from 'child_process'
import { assertThat, hasProperty, matchesPattern, promiseThat, rejected, startsWith } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitRepo } from './git_repo'

const exec = promisify(childProcess.exec)
describe(GitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  describe('running arbitrary git commands', () => {
    it('returns a promise of the result', async () => {
      const repoPath = path.resolve(root, 'a-repo')
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitRepo(repoPath)
      const result = await repo.execGit('init')
      assertThat(result.stdout, startsWith('Initialized empty Git repository'))
    })

    it('raises any error', async () => {
      const repoPath = path.resolve(root, 'a-repo')
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitRepo(repoPath)
      await promiseThat(
        repo.execGit('not-a-command'),
        rejected(hasProperty('message', matchesPattern('is not a git command'))),
      )
    })
  })
})

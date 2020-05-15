import path from 'path'
import childProcess from 'child_process'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)
import { LocalGitRepo } from './local_git_repo'
import {
  assertThat,
  startsWith,
  rejected,
  promiseThat,
  containsInAnyOrder,
  hasProperty,
  matchesPattern,
  not,
  equalTo,
  willBe,
} from 'hamjest'

describe(LocalGitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  describe('running arbitrary git commands', () => {
    it('returns a promise of the result', async () => {
      const repoId = 'a-new-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      const result = await repo.execGit('init')
      assertThat(result.stdout, startsWith('Initialized empty Git repository'))
    })

    it('does not raise any error', async () => {
      const repoId = 'a-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      await promiseThat(repo.execGit('not-a-command'), not(rejected()))
      return promiseThat(
        repo.execGit('not-a-command'),
        willBe(hasProperty('exitCode', not(equalTo(0)))),
      )
    })
  })

  describe('listing refs', () => {
    it('lists the branches in the repo', async () => {
      const repoId = 'a-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      await repo.execGit('init')
      await repo.execGit('config', 'user.email', 'test@example.com')
      await repo.execGit('config', 'user.name', 'Test User')
      const branches = ['one', 'two']
      for (const branchName of branches) {
        await repo.execGit('checkout', '-b', branchName)
        await repo.execGit('commit', '--allow-empty', '-m "test"')
      }
      const refs = await repo.refs()
      assertThat(
        refs.map(ref => ref.name),
        containsInAnyOrder('refs/heads/one', 'refs/heads/two'),
      )
      for (const ref of refs) {
        assertThat(ref, hasProperty('revision', matchesPattern('[a-e][0-9]')))
      }
    })
  })
})

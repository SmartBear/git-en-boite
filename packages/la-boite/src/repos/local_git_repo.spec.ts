import childProcess from 'child_process'
import { assertThat, containsInAnyOrder, hasProperty, matchesPattern } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { LocalGitRepo } from './local_git_repo'

const exec = promisify(childProcess.exec)
describe(LocalGitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
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

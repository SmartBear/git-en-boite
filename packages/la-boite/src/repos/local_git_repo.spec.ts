import path from 'path'
import childProcess from 'child_process'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)
import { LocalGitRepo } from './local_git_repo'
import { GitProcess } from 'dugite'
import { assertThat, equalTo, startsWith, rejected, promiseThat } from 'hamjest'

describe(LocalGitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  before(async () => {
    await exec(`rm -rf ${root}`)
  })

  describe('running arbitrary git commands', () => {
    it('returns a promise of the stdout', async () => {
      const repoId = 'a-new-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      const output = await repo.git('init')
      assertThat(output, startsWith('Initialized empty Git repository'))
    })

    it('raises any error', async () => {
      const repoId = 'a-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      return promiseThat(repo.git('not-a-command'), rejected())
    })
  })

  it('lists the local branches in the repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, repoId)
    const repo = await LocalGitRepo.open(repoPath)
    await repo.git('init')
    await repo.git('config', 'user.email', 'test@example.com')
    await repo.git('config', 'user.name', 'Test User')
    const branches = ['master', 'test']
    for (const branchName of branches) {
      await repo.git('checkout', '-b', branchName)
      await repo.git('commit', '--allow-empty', '-m "test"')
    }
    assertThat(await repo.branches(), equalTo(branches))
  })
})

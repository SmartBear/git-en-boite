import path from 'path'
import childProcess from 'child_process'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)
import { LocalGitRepo } from './local_git_repo'
import { GitProcess } from 'dugite'
import { assertThat, equalTo } from 'hamjest'

describe(LocalGitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  before(async () => {
    await exec(`rm -rf ${root}`)
  })

  it('lists the local branches in the repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, repoId)
    const branches = ['master', 'test']
    await exec(`mkdir -p ${repoPath}`)
    const git = async (...args: string[]) => {
      const result = await GitProcess.exec(args, repoPath)
      if (result.exitCode > 0) throw new Error(result.stderr)
    }
    await git('init')
    await git('config', 'user.email', 'test@example.com')
    await git('config', 'user.name', 'Test User')
    for (const branchName of branches) {
      await git('checkout', '-b', branchName)
      await git('commit', '--allow-empty', '-m "test"')
    }
    const repo = new LocalGitRepo(repoId, repoPath)
    assertThat(await repo.branches(), equalTo(branches))
  })
})

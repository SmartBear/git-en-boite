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
    await exec(`mkdir -p ${repoPath}`)
    const git = (...args: string[]) => GitProcess.exec(args, repoPath)
    await git('init')
    const branches = ['master', 'test']
    for (const branchName of branches) {
      await git('checkout', '-b', branchName)
      await git('commit', '--allow-empty', '-m "test"')
    }
    const repo = new LocalGitRepo(repoId, repoPath)
    assertThat(await repo.branches(), equalTo(branches))
  })
})

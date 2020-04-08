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

  it('lists the branches in the repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(__dirname, '../../tmp/test', repoId)
    await exec(`mkdir -p ${repoPath}`)
    await GitProcess.exec(['init'], repoPath)
    await GitProcess.exec(['commit', '--allow-empty', '-m "test"'], repoPath)
    await GitProcess.exec(['checkout', '-b', 'test'], repoPath)
    await GitProcess.exec(['commit', '--allow-empty', '-m "test"'], repoPath)
    const repo = new LocalGitRepo(repoId, repoPath)
    assertThat(await repo.branches(), equalTo(['master', 'test']))
  })
})

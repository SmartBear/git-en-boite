import path from 'path'
import { LocalGitRepos } from './local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import { assertThat, equalTo } from 'hamjest'
import { ConnectRepoRequest } from './git_repos'
import { GitProcess } from 'dugite'
const exec = promisify(childProcess.exec)

describe(LocalGitRepos.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  before(async () => {
    await exec(`rm -rf ${root}`)
  })

  it('can find an existing repo in the folder', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, repoId)
    await exec(`mkdir -p ${repoPath}`)
    const repos = new LocalGitRepos(root)
    const repo = repos.findRepo(repoId)
    assertThat(repo.id, equalTo(repoId))
    assertThat(repo.path, equalTo(repoPath))
  })

  it('can connect a new repo by cloning from a remote URL', async () => {
    const repoId = 'a-new-repo'
    const remoteUrl = path.resolve(__dirname, '../../tmp/remote/', repoId)
    const request: ConnectRepoRequest = {
      repoId,
      remoteUrl,
    }
    await exec(`rm -rf ${remoteUrl}`)
    const repoPath = remoteUrl
    const branches = ['master']
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
    const repos = new LocalGitRepos(root)
    await repos.connectToRemote(request)
    const repo = repos.findRepo(repoId)
    assertThat(repo.id, equalTo(repoId))
    assertThat(await repo.branches(), equalTo(['master']))
  })
})

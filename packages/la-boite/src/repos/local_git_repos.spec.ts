import path from 'path'
import { LocalGitRepos } from './local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import { assertThat, equalTo, promiseThat, fulfilled } from 'hamjest'
import { ConnectRepoRequest } from './git_repos'
import { LocalGitRepo } from './local_git_repo'
const exec = promisify(childProcess.exec)

describe(LocalGitRepos.name, () => {
  const root = path.resolve(__dirname, '../../tmp')
  let repos: LocalGitRepos

  before(async () => {
    await exec(`rm -rf ${root}`)
    repos = new LocalGitRepos(root)
  })

  after(async () => {
    await repos.close()
  })

  describe('waiting for a repo to become idle', () => {
    it('resolves immediately if the repo is already idle', () => {
      promiseThat(repos.waitUntilIdle('a-repo'), fulfilled())
    })
  })

  it('can find an existing repo in the folder', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, repoId)
    await exec(`mkdir -p ${repoPath}`)
    const repo = repos.findRepo(repoId).results[0]
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
    const repo = await LocalGitRepo.open(repoPath)
    await repo.git('init')
    await repo.git('config', 'user.email', 'test@example.com')
    await repo.git('config', 'user.name', 'Test User')
    for (const branchName of branches) {
      await repo.git('checkout', '-b', branchName)
      await repo.git('commit', '--allow-empty', '-m "test"')
    }
    await repos.connectToRemote(request)
    await repos.waitUntilIdle(repoId)
    const result = repos.findRepo(repoId).results[0]
    assertThat(await result.branches(), equalTo(['master']))
  })
})

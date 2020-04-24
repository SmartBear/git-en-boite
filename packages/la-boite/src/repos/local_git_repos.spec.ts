import path from 'path'
import { LocalGitRepos } from './local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import {
  assertThat,
  promiseThat,
  fulfilled,
  hasProperty,
  containsInAnyOrder,
  is,
  truthy,
  falsy,
} from 'hamjest'
import { ConnectRepoRequest } from './git_repos'
import { LocalGitRepo } from './local_git_repo'
const exec = promisify(childProcess.exec)

describe(LocalGitRepos.name, () => {
  const root = path.resolve(__dirname, '../../tmp')
  let repos: LocalGitRepos

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
    repos = new LocalGitRepos(root)
  })

  afterEach(async () => {
    await repos.close()
  })

  describe('waiting for a repo to become idle', () => {
    it('resolves immediately if the repo is already idle', () => {
      promiseThat(repos.waitUntilIdle('a-repo'), fulfilled())
    })
  })

  describe('getting repo info', () => {
    it('returns an empty QueryResult if the repo does not exist', async () => {
      const result = await repos.getInfo('a-repo-id')
      assertThat(result.isSuccess, is(falsy()))
    })

    it('returns an object with the refs in the repo', async () => {
      const repoId = 'a-new-repo'
      const remoteUrl = path.resolve(__dirname, '../../tmp/remote/', repoId)
      const request: ConnectRepoRequest = {
        repoId,
        remoteUrl,
      }
      await exec(`rm -rf ${remoteUrl}`)
      const repoPath = remoteUrl
      const branches = ['master', 'development']
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
      const result = await repos.getInfo(repoId)
      assertThat(result.isSuccess, is(truthy()))
      result.respond({
        foundOne: repoInfo =>
          assertThat(
            repoInfo,
            hasProperty('refs', containsInAnyOrder('refs/heads/master', 'refs/heads/development')),
          ),
      })
    })
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
    const result = await repos.getInfo(repoId)
    assertThat(result.isSuccess, is(truthy()))
  })
})

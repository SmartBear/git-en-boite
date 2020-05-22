import childProcess from 'child_process'
import { TestableGitRepoFactory } from 'git-en-boite-adapter-git'
import { Commit, EnsureBranchExists, GetRevision, Init } from 'git-en-boite-core-port-git'
import {
  assertThat,
  equalTo,
  falsy,
  fulfilled,
  hasProperty,
  is,
  promiseThat,
  truthy,
} from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { ConnectRepoRequest } from './interfaces'
import { LocalGitRepos } from './local_git_repos'

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
    it('resolves immediately if the repo is already idle', async () => {
      await promiseThat(repos.waitUntilIdle('a-repo'), fulfilled())
    })
  })

  describe('getting repo info', () => {
    it('returns an empty QueryResult if the repo does not exist', async () => {
      const result = await repos.getInfo('a-repo-id')
      assertThat(result.isSuccess, is(falsy()))
    })

    it('returns an object with the refs in the repo', async () => {
      const repoId = 'a-new-repo'
      const remoteUrl = path.resolve(root, 'remote', repoId)
      const request: ConnectRepoRequest = {
        repoId,
        remoteUrl,
      }
      const repoPath = remoteUrl
      const branches = ['master', 'development']
      const git = await new TestableGitRepoFactory().open(repoPath)
      await git(Init.normalRepo())
      await git(Commit.withMessage('Initial commit'))
      for (const branchName of branches) {
        await git(EnsureBranchExists.named(branchName))
        await git(Commit.withMessage('A commit'))
      }
      await repos.connectToRemote(request)
      await repos.waitUntilIdle(repoId)
      const result = await repos.getInfo(repoId)
      assertThat(result.isSuccess, is(truthy()))
      await result.respond({
        foundOne: repoInfo => assertThat(repoInfo.refs, hasProperty('length', equalTo(2))),
      })
    })

    it('returns an object with the local branches in the repo', async () => {
      const repoId = 'a-new-repo'
      const remoteUrl = path.resolve(root, 'remote', repoId)
      const request: ConnectRepoRequest = {
        repoId,
        remoteUrl,
      }
      const repoPath = remoteUrl
      const branches = ['master', 'development']
      const git = await new TestableGitRepoFactory().open(repoPath)
      await git(Init.normalRepo())
      await git(Commit.withMessage('Initial commit'))
      for (const branchName of branches) {
        await git(EnsureBranchExists.named(branchName))
        await git(Commit.withMessage('A commit'))
      }
      await repos.connectToRemote(request)
      await repos.waitUntilIdle(repoId)
      const result = await repos.getInfo(repoId)
      assertThat(result.isSuccess, is(truthy()))
      await result.respond({
        foundOne: repoInfo => assertThat(repoInfo.branches, hasProperty('length', equalTo(2))),
      })
    })
  })

  it('can connect a new repo by cloning from a remote URL', async () => {
    const repoId = 'a-new-repo'
    const remoteUrl = path.resolve(root, 'remote', repoId)
    const request: ConnectRepoRequest = {
      repoId,
      remoteUrl,
    }
    const repoPath = remoteUrl
    const branches = ['master']
    const git = await new TestableGitRepoFactory().open(repoPath)
    await git(Init.normalRepo())
    await git(Commit.withMessage('Initial commit'))
    for (const branchName of branches) {
      await git(EnsureBranchExists.named(branchName))
      await git(Commit.withMessage('A commit'))
    }
    await repos.connectToRemote(request)
    await repos.waitUntilIdle(repoId)
    const result = await repos.getInfo(repoId)
    assertThat(result.isSuccess, is(truthy()))
  })

  it('can fetch for an existing repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, 'remote', repoId)
    const git = await new TestableGitRepoFactory().open(repoPath)
    await git(Init.normalRepo())
    await git(Commit.withMessage('Initial commit'))
    await repos.connectToRemote({ repoId, remoteUrl: repoPath })
    await repos.waitUntilIdle(repoId)
    await git(Commit.withMessage('Another commit'))
    const expectedRevision = await git(GetRevision.forCurrentBranch())
    await repos.fetchFromRemote({ repoId })
    await repos.waitUntilIdle(repoId)
    const result = await repos.getInfo(repoId)
    await result.respond({
      foundOne: repoInfo =>
        assertThat(
          repoInfo.branches.find(branch => branch.name === 'master').revision,
          equalTo(expectedRevision),
        ),
    })
  })
})

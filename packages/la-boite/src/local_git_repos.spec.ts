import { ConnectRepoRequest } from 'git-en-boite-client-port'
import { NonBareRepoFactory } from 'git-en-boite-git-adapter'
import { Commit, EnsureBranchExists, GetRevision, Init } from 'git-en-boite-git-port'
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
import { dirSync } from 'tmp'

import { LocalGitRepos } from './local_git_repos'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'
import { createConfig } from 'git-en-boite-config'

describe(LocalGitRepos.name, () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  let repos: LocalGitRepos
  beforeEach(() => {
    const taskScheduler = BullRepoTaskScheduler.make(createConfig().redis)
    repos = new LocalGitRepos(root, taskScheduler)
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
      const git = await new NonBareRepoFactory().open(repoPath)
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
      const git = await new NonBareRepoFactory().open(repoPath)
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
    const git = await new NonBareRepoFactory().open(repoPath)
    await git(Init.nonBareRepo())
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
    const git = await new NonBareRepoFactory().open(repoPath)
    await git(Commit.withMessage('Initial commit'))
    await repos.connectToRemote({ repoId, remoteUrl: repoPath })
    await repos.waitUntilIdle(repoId)
    await git(Commit.withMessage('Another commit'))
    const expectedRevision = await git(GetRevision.forBranchNamed('master'))
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

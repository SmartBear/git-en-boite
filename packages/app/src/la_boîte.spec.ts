import { ConnectRepoRequest } from 'git-en-boite-client-port'
import { createConfig } from 'git-en-boite-config'
import { DugiteGitRepo, NonBareRepoFactory } from 'git-en-boite-git-adapter'
import { Commit, EnsureBranchExists, GetRevision, Init } from 'git-en-boite-git-adapter'
import { DiskRepoIndex } from 'git-en-boite-repo-index-adapter'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'
import { assertThat, equalTo, falsy, hasProperty, is, truthy } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { LaBoîte } from './la_boîte'

describe(LaBoîte.name, () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  let app: LaBoîte
  beforeEach(() => {
    const taskScheduler = BullRepoTaskScheduler.make(createConfig().redis)
    const repoIndex = new DiskRepoIndex(root, DugiteGitRepo)
    app = new LaBoîte(taskScheduler, repoIndex, '999.9.9-test')
  })
  afterEach(async () => {
    await app.close()
  })

  describe('getting repo info', () => {
    it('returns an empty QueryResult if the repo does not exist', async () => {
      const result = await app.getInfo('a-repo-id')
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
      await app.connectToRemote(request)
      await app.fetchFromRemote({ repoId })
      const result = await app.getInfo(repoId)
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
      await app.connectToRemote(request)
      await app.fetchFromRemote({ repoId })
      const result = await app.getInfo(repoId)
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
    await app.connectToRemote(request)
    await app.fetchFromRemote({ repoId })
    const result = await app.getInfo(repoId)
    assertThat(result.isSuccess, is(truthy()))
  })

  it('can fetch for an existing repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, 'remote', repoId)
    const git = await new NonBareRepoFactory().open(repoPath)
    await git(Commit.withMessage('Initial commit'))
    await app.connectToRemote({ repoId, remoteUrl: repoPath })
    await app.fetchFromRemote({ repoId })
    await git(Commit.withMessage('Another commit'))
    const expectedRevision = await git(GetRevision.forBranchNamed('master'))
    await app.fetchFromRemote({ repoId })
    const result = await app.getInfo(repoId)
    await result.respond({
      foundOne: repoInfo =>
        assertThat(
          repoInfo.branches.find(branch => branch.name === 'master').revision,
          equalTo(expectedRevision),
        ),
    })
  })
})

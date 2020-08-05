import { File } from 'git-en-boite-core'
import {
  Commit,
  DugiteGitRepo,
  EnsureBranchExists,
  GetFiles,
  GetRevision,
  Init,
  NonBareRepoFactory,
} from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { assertThat, contains, equalTo, falsy, hasProperty, is, truthy } from 'hamjest'
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
    const repoIndex = new DiskRepoIndex(root, DugiteGitRepo)
    app = new LaBoîte(repoIndex, '999.9.9-test')
  })

  describe('getting repo info', () => {
    it('returns an empty QueryResult if the repo does not exist', async () => {
      const result = await app.getInfo('a-repo-id')
      assertThat(result.isSuccess, is(falsy()))
    })

    it('returns an object with the local branches in the repo', async () => {
      const repoId = 'a-new-repo'
      const remoteUrl = path.resolve(root, 'remote', repoId)
      const repoPath = remoteUrl
      const branches = ['master', 'development']
      const origin = await new NonBareRepoFactory().open(repoPath)
      for (const branchName of branches) {
        await origin(EnsureBranchExists.named(branchName))
        await origin(Commit.withMessage('A commit'))
      }
      await app.connectToRemote(repoId, remoteUrl)
      await app.fetchFromRemote(repoId)
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
    const repoPath = remoteUrl
    const branches = ['master']
    const origin = await new NonBareRepoFactory().open(repoPath)
    await origin(Init.nonBareRepo())
    await origin(Commit.withMessage('Initial commit'))
    for (const branchName of branches) {
      await origin(EnsureBranchExists.named(branchName))
      await origin(Commit.withMessage('A commit'))
    }
    await app.connectToRemote(repoId, remoteUrl)
    await app.fetchFromRemote(repoId)
    const result = await app.getInfo(repoId)
    assertThat(result.isSuccess, is(truthy()))
  })

  it('can fetch for an existing repo', async () => {
    const repoId = 'a-repo-id'
    const repoPath = path.resolve(root, 'remote', repoId)
    const origin = await new NonBareRepoFactory().open(repoPath)
    await origin(Commit.withMessage('Initial commit'))
    await app.connectToRemote(repoId, repoPath)
    await app.fetchFromRemote(repoId)
    await origin(Commit.withMessage('Another commit'))
    const expectedRevision = await origin(GetRevision.forBranchNamed('master'))
    await app.fetchFromRemote(repoId)
    const result = await app.getInfo(repoId)
    await result.respond({
      foundOne: repoInfo =>
        assertThat(
          repoInfo.branches.find(branch => branch.name === 'master').revision,
          equalTo(expectedRevision),
        ),
    })
  })

  describe.skip('@wip commiting', () => {
    it('pushes a new file to the origin', async () => {
      const repoId = 'a-new-repo'
      const remoteUrl = path.resolve(root, 'remote', repoId)
      const repoPath = remoteUrl
      const branchName = 'main'
      const origin = await new NonBareRepoFactory().open(repoPath)
      await origin(EnsureBranchExists.named(branchName))
      await origin(Commit.withMessage('Inital commit'))
      await app.connectToRemote(repoId, remoteUrl)
      await app.fetchFromRemote(repoId)
      const file: File = {
        path: 'feature.feature',
        content: 'Feature: Feature',
      }

      await app.commit(repoId, branchName, file)

      assertThat(await origin(GetFiles.forBranchNamed(branchName)), contains(file))
    })
  })
})

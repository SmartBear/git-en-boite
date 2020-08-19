import { File, RefName, BranchName } from 'git-en-boite-core'
import {
  RepoFactory,
  Commit,
  DugiteGitRepo,
  GetFiles,
  GitDirectory,
  LocalCommitRef,
} from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { assertThat, contains, equalTo, falsy, hasProperty, is, truthy } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { LaBoîte } from './la_boîte'

describe(LaBoîte.name, () => {
  const repoId = 'a-new-repo'
  const branchName = 'main'
  const commitRef = LocalCommitRef.forBranch(BranchName.of(branchName))

  let app: LaBoîte
  let root: string
  let remoteUrl: string

  beforeEach(() => {
    root = dirSync().name
    remoteUrl = path.resolve(root, 'remote', repoId)
    const repoIndex = new DiskRepoIndex(root, DugiteGitRepo)
    app = new LaBoîte(repoIndex, '999.9.9-test')
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('getting repo info', () => {
    it('returns an empty QueryResult if the repo does not exist', async () => {
      const result = await app.getInfo('a-repo-id')
      assertThat(result.isSuccess, is(falsy()))
    })

    it('returns an object with the local branches in the repo', async () => {
      const branches = ['master', 'development']
      const origin = await new RepoFactory().open(remoteUrl)
      for (const branchName of branches)
        await origin(Commit.toCommitRef(LocalCommitRef.forBranch(BranchName.of(branchName))))
      await app.connectToRemote(repoId, remoteUrl)
      await app.fetchFromRemote(repoId)
      const result = await app.getInfo(repoId)
      assertThat(result.isSuccess, is(truthy()))
      await result.respond({
        foundOne: repoInfo =>
          assertThat(repoInfo.branches, hasProperty('length', equalTo(branches.length))),
      })
    })
  })

  it('can connect a new repo by cloning from a remote URL', async () => {
    const origin = await new RepoFactory().open(remoteUrl)
    await origin(Commit.toCommitRef(commitRef))
    await app.connectToRemote(repoId, remoteUrl)
    await app.fetchFromRemote(repoId)
    const result = await app.getInfo(repoId)
    assertThat(result.isSuccess, is(truthy()))
  })

  it('can fetch for an existing repo', async () => {
    const revParse = async (refName: RefName, repoPath: string) =>
      new GitDirectory(repoPath).read('rev-parse', [refName.value])

    const origin = await new RepoFactory().open(remoteUrl)
    await origin(Commit.toCommitRef(commitRef))
    await app.connectToRemote(repoId, remoteUrl)
    await app.fetchFromRemote(repoId)
    await origin(Commit.toCommitRef(commitRef))
    const expectedRevision = await revParse(commitRef.local, remoteUrl)
    await app.fetchFromRemote(repoId)
    const result = await app.getInfo(repoId)
    await result.respond({
      foundOne: repoInfo => {
        assertThat(
          repoInfo.branches.find(branch => branch.name === branchName).revision,
          equalTo(expectedRevision),
        )
      },
    })
  })

  describe('commiting', () => {
    it('pushes a new file to the origin', async () => {
      const origin = await new RepoFactory().open(remoteUrl)
      await origin(Commit.toCommitRef(commitRef))
      await app.connectToRemote(repoId, remoteUrl)
      await app.fetchFromRemote(repoId)
      const file: File = {
        path: 'feature.feature',
        content: 'Feature: Feature',
      }

      await app.commit(repoId, BranchName.of(branchName), file)

      assertThat(await origin(GetFiles.for(BranchName.of(branchName))), contains(file))
    })
  })
})

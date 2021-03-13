import fs from 'fs'
import { BranchName, FileContent, FilePath, GitFile, Refs } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { handleCommit, handleInit, handleShowFile } from '../handlers'
import { Commit, GetRefs, Init, ShowFile } from '../operations'
import { handleGetRefs } from './handleGetRefs'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<ShowFile, FileContent>, AsyncQuery<GetRefs, Refs>]

describe('handleShowFile', () => {
  let root: string
  let git: Dispatch<Protocol>
  let repo: GitDirectory
  let repoPath: string

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')

    fs.mkdirSync(repoPath, { recursive: true })
    repo = new GitDirectory(repoPath)
    git = messageDispatch<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
      [ShowFile, handleShowFile],
      [GetRefs, handleGetRefs],
    ])
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  context('with a commit containing the right file', () => {
    const branchName = BranchName.of('a-branch')
    const commitRef = LocalCommitRef.forBranch(branchName)
    const filePath = new FilePath('a.feature')
    const expectedFileContent = new FileContent('Feature: A')
    const file = new GitFile(filePath, expectedFileContent)

    beforeEach(async () => {
      await git(Commit.toCommitRef(commitRef).withFiles([file]))
    })

    it('returns the file content for a revision', async () => {
      const refs: Refs = await git(GetRefs.all())
      const revision = refs.forBranch(branchName).revision
      const fileContent = await git(ShowFile.for(revision).at(filePath))
      assertThat(fileContent, equalTo(expectedFileContent))
    })

    it('returns the file content for a ref', async () => {
      const refs = await git(GetRefs.all())
      const ref = refs.forBranch(branchName).refName
      const fileContent = await git(ShowFile.for(ref).at(filePath))
      assertThat(fileContent, equalTo(expectedFileContent))
    })
  })
})

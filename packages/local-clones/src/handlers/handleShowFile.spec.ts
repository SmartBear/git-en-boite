import fs from 'fs'
import { BranchName, FileContent, FilePath, GitFile } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { handleCommit, handleInit, handleShowFile } from '../handlers'
import { Commit, Init, ShowFile } from '../operations'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<ShowFile, FileContent>]

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

    it('returns the file content', async () => {
      const fileContent = await git(ShowFile.for(branchName.value).at(filePath))
      assertThat(fileContent, equalTo(expectedFileContent))
    })
  })
})

import fs from 'fs'
import { BranchName, GitFile } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, contains } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleCommit, handleGetFiles, handleInit } from '.'
import { LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { Commit, GetFiles, Init } from '../operations'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<GetFiles, GitFile[]>]

describe('handleGetFiles', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const openRepo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return messageDispatch<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
      [GetFiles, handleGetFiles],
    ])
  }

  it('reads a single file from a repo', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const file = new GitFile('a.file', 'some content')
    const git = await openRepo(repoPath)
    await git(Init.bareRepo())
    const branchName = BranchName.of('a-branch')
    await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)).withFiles([file]))
    const files = await git(GetFiles.for(branchName))
    assertThat(files, contains(file))
  })
})

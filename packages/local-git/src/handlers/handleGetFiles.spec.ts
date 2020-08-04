import { GitProcess } from 'dugite'
import fs from 'fs'
import { File } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, messageDispatch } from 'git-en-boite-message-dispatch'
import { dirSync } from 'tmp'

import { handleCommit, handleGetFiles, handleInit } from '.'
import { Commit, GetFiles, Init, EnsureBranchExists } from '../operations'

// import { equalTo, fulfilled, promiseThat, rejected, assertThat } from 'hamjest'
import path from 'path'
import { GitDirectory } from '../git_directory'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'
import { assertThat, contains } from 'hamjest'

type Protocol = [
  AsyncCommand<Init>,
  AsyncCommand<Commit>,
  AsyncCommand<EnsureBranchExists>,
  AsyncQuery<GetFiles, File[]>,
]

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
      [EnsureBranchExists, handleEnsureBranchExists],
      [GetFiles, handleGetFiles],
    ])
  }

  it('reads a single file from a repo', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const file = { path: 'a.file', content: 'File content' }
    const git = await openRepo(repoPath)
    await git(Init.nonBareRepo())
    await GitProcess.exec(['checkout', '-b', 'main'], repoPath)
    fs.writeFileSync(path.resolve(repoPath, file.path), file.content)
    await GitProcess.exec(['add', '.'], repoPath)
    await git(Commit.withAnyMessage())
    const files = await git(GetFiles.forBranchNamed('main'))
    assertThat(files, contains(file))
  })
})

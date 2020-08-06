import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { containsString, fulfilled, hasProperty, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { handleCommitToBareRepo, handleFetch, handleInit, handleSetOrigin } from '.'
import { GitDirectory } from '../git_directory'
import { NonBareRepoFactory } from '../non_bare_repo_factory'
import { Commit, EnsureBranchExists, Fetch, Init, SetOrigin } from '../operations'

const exec = promisify(childProcess.exec)

type Protocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
]

describe('handleCommitToBareRepo', () => {
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
      [Commit, handleCommitToBareRepo],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
    ])
  }

  let repoPath: string
  let git: Dispatch<Protocol>

  beforeEach(async () => {
    repoPath = path.resolve(root, 'a-repo-id')
    git = await openRepo(repoPath)
    await git(Init.bareRepo())
  })

  it.only('creates an empty commit with the given message', async () => {
    await git(Commit.withMessage('A commit message'))
    await promiseThat(
      exec('git log main --oneline', { cwd: repoPath }),
      fulfilled(hasProperty('stdout', containsString('A commit message'))),
    )
  })

  it('@wip creates a commit containing the given files', async () => {
    const file = { path: 'a.file', content: 'some content' }
    const branchName = 'a-branch'
    await git(Commit.newFile(file).toBranch(branchName))
    await promiseThat(
      exec(`git ls-tree ${branchName} -r --name-only`),
      fulfilled(hasProperty('stdout', containsString(file.path))),
    )
  })
})

import fs from 'fs'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import {
  containsString,
  containsStrings,
  fulfilled,
  hasProperty,
  not,
  promiseThat,
  assertThat,
  string,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleCommit, handleInit } from '.'
import { GitDirectory } from '../git_directory'
import { Commit, Init, SetOrigin, Fetch } from '../operations'
import { handleSetOrigin } from './handleSetOrigin'
import { handleFetch } from './handleFetch'

type Protocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Init>,
  AsyncCommand<Fetch>,
  AsyncCommand<SetOrigin>,
]

describe('handleCommit', () => {
  const branchName = 'a-branch'
  let root: string
  let repoPath: string
  let git: Dispatch<Protocol>
  let repo: GitDirectory

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    fs.mkdirSync(repoPath, { recursive: true })
    repo = new GitDirectory(repoPath)
    git = messageDispatch<Protocol>().withHandlers(repo, [
      [Commit, handleCommit],
      [Init, handleInit],
      [Fetch, handleFetch],
      [SetOrigin, handleSetOrigin],
    ])
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  it('creates an empty commit with the given message', async () => {
    const refName = `refs/heads/${branchName}`
    await git(Commit.withMessage('A commit message').toRef(refName).onBranch(branchName))
    await promiseThat(
      repo.execGit('log', [refName, '--oneline']),
      fulfilled(hasProperty('stdout', containsString('A commit message'))),
    )
  })

  it('creates a commit containing the given files', async () => {
    const file = { path: 'a.file', content: 'some content' }
    const refName = `refs/heads/${branchName}`
    await git(Commit.newFile(file).onBranch(branchName).toRef(refName))
    await promiseThat(
      repo.execGit('ls-tree', [refName, '-r', '--name-only']),
      fulfilled(hasProperty('stdout', containsString(file.path))),
    )
  })

  it('creates a commit after an existing one on a remote', async () => {
    const refName = `refs/heads/${branchName}`
    const remoteRefName = `refs/remotes/origin/${branchName}`
    await git(Commit.withMessage('initial commit').toRef(remoteRefName).onBranch(branchName))
    await git(Commit.withMessage('A commit message').toRef(refName).onBranch(branchName))
    await promiseThat(
      repo.execGit('log', [refName, '--oneline']),
      fulfilled(hasProperty('stdout', containsStrings('initial commit', 'A commit message'))),
    )
  })

  it('clears the index before committing', async () => {
    const file = { path: 'a.file', content: 'some content' }
    const refName = `refs/heads/${branchName}`
    await repo.addFileToIndex({ path: 'junk.file', content: 'Junk' })
    await git(Commit.newFile(file).toRef(refName).onBranch(branchName))

    await promiseThat(
      repo.execGit('ls-tree', [refName, '-r', '--name-only']),
      fulfilled(hasProperty('stdout', not(containsString('junk.file')))),
    )
  })
})

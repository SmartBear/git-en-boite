import fs from 'fs'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { containsString, containsStrings, fulfilled, hasProperty, not, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleCommit, handleInit } from '.'
import { GitDirectory } from '../git_directory'
import { Commit, Init } from '../operations'

type Protocol = [AsyncCommand<Commit>, AsyncCommand<Init>]

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
    ])
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  it('creates an empty commit with the given message', async () => {
    await git(Commit.withMessage('A commit message'))
    await promiseThat(
      repo.execGit('log', ['main', '--oneline']),
      fulfilled(hasProperty('stdout', containsString('A commit message'))),
    )
  })

  it('creates a commit containing the given files', async () => {
    const file = { path: 'a.file', content: 'some content' }
    await git(Commit.newFile(file).toBranch(branchName))
    await promiseThat(
      repo.execGit('ls-tree', [branchName, '-r', '--name-only']),
      fulfilled(hasProperty('stdout', containsString(file.path))),
    )
  })

  it('creates a commit after an existing one', async () => {
    await git(Commit.withMessage('initial commit'))
    await git(Commit.withMessage('A commit message'))
    await promiseThat(
      repo.execGit('log', ['main', '--oneline']),
      fulfilled(hasProperty('stdout', containsStrings('initial commit', 'A commit message'))),
    )
  })

  it('clears the index before committing', async () => {
    await repo.addFileToIndex({ path: 'junk.file', content: 'Junk' })
    const file = { path: 'a.file', content: 'some content' }
    await git(Commit.newFile(file).toBranch(branchName))
    await promiseThat(
      repo.execGit('ls-tree', [branchName, '-r', '--name-only']),
      fulfilled(hasProperty('stdout', not(containsString('junk.file')))),
    )
  })
})

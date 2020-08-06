import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { containsString, containsStrings, fulfilled, hasProperty, not, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { handleCommitToBareRepo, handleInit } from '.'
import { GitDirectory } from '../git_directory'
import { Commit, Init } from '../operations'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Commit>, AsyncCommand<Init>]

describe.only('handleCommitToBareRepo', () => {
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
      [Commit, handleCommitToBareRepo],
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
      exec(`git log main --oneline`, { cwd: repoPath }),
      fulfilled(hasProperty('stdout', containsString('A commit message'))),
    )
  })

  it('creates a commit containing the given files', async () => {
    const file = { path: 'a.file', content: 'some content' }
    await git(Commit.newFile(file).toBranch(branchName))
    await promiseThat(
      exec(`git ls-tree ${branchName} -r --name-only`, { cwd: repoPath }),
      fulfilled(hasProperty('stdout', containsString(file.path))),
    )
  })

  it('creates a commit after an existing one', async () => {
    await git(Commit.withMessage('initial commit'))
    await git(Commit.withMessage('A commit message'))
    await promiseThat(
      exec(`git log main --oneline`, { cwd: repoPath }),
      fulfilled(hasProperty('stdout', containsStrings('initial commit', 'A commit message'))),
    )
  })

  it('clears the index before committing', async () => {
    const objectId = await new Promise((resolve, reject) => {
      const result = childProcess.exec(
        'git hash-object -w --stdin',
        { cwd: repoPath },
        (err, stdout) => {
          if (err) return reject(err)
          resolve(stdout.trim())
        },
      )
      result.stdin.write('Junk content')
      result.stdin.end()
    })

    await exec(`git update-index --add --cacheinfo 100644 ${objectId} junk.file`, { cwd: repoPath })
    const file = { path: 'a.file', content: 'some content' }
    await git(Commit.newFile(file).toBranch(branchName))
    await promiseThat(
      exec(`git ls-tree ${branchName} -r --name-only`, { cwd: repoPath }),
      fulfilled(hasProperty('stdout', not(containsString('junk.file')))),
    )
  })
})

import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, messageDispatch, Dispatch } from 'git-en-boite-message-dispatch'
import { Author } from 'git-en-boite-core'
import { Commit, Init } from '../operations'
import { containsString, fulfilled, hasProperty, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommitToNonBareRepo } from './handleCommitToNonBareRepo'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>]

describe('handleCommitToNonBareRepo', () => {
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
      [Commit, handleCommitToNonBareRepo],
    ])
  }

    let repoPath: string
    let git: Dispatch<Protocol>

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await openRepo(repoPath)
      await git(Init.nonBareRepo())
      await exec('git checkout -b main', { cwd: repoPath })
      await exec('git commit --allow-empty -m "initial commit"', { cwd: repoPath })
    })

    it('creates a commit with the given message', async () => {
      await git(Commit.withMessage('A commit message'))
      await promiseThat(
        exec('git log main --oneline', { cwd: repoPath }),
        fulfilled(hasProperty('stdout', containsString('A commit message'))),
      )
    })

    it('creates a commit with the given author details', async () => {
      const name = 'Someone'
      const email = 'test@exmaple.com'
      await git(Commit.withAnyMessage().byAuthor(new Author(name, email)))
      await promiseThat(
        exec('git log main --pretty=format:"%an <%ae>"', { cwd: repoPath }),
        fulfilled(hasProperty('stdout', containsString(`${name} <${email}>`))),
      )
    })
})
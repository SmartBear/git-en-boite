import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Author } from 'git-en-boite-core'
import { Commit, Init } from 'git-en-boite-git-port'
import { containsString, fulfilled, hasProperty, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>]

describe('handleCommit', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const openRepo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return commandBus<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
    ])
  }

  context('in a non-bare repo', () => {
    let repoPath: string
    let git: Dispatch<Protocol>

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await openRepo(repoPath)
      await git(Init.nonBareRepo())
    })

    it('creates a commit with the given message', async () => {
      await git(Commit.withMessage('A commit message'))
      await promiseThat(
        exec('git log --oneline', { cwd: repoPath }),
        fulfilled(hasProperty('stdout', containsString('A commit message'))),
      )
    })

    it('creates a commit with the given author details', async () => {
      const name = 'Someone'
      const email = 'test@exmaple.com'
      await git(Commit.withAnyMessage().byAuthor(new Author(name, email)))
      await promiseThat(
        exec('git log --pretty=format:"%an <%ae>"', { cwd: repoPath }),
        fulfilled(hasProperty('stdout', containsString(`${name} <${email}>`))),
      )
    })
  })
})

import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, commandBus } from 'git-en-boite-command-bus'
import { Author } from 'git-en-boite-core'
import { Commit, Init } from 'git-en-boite-git-port'
import { containsString, fulfilled, hasProperty, promiseThat } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>]

describe('handleCommit', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return commandBus<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
    ])
  }

  context('in a non-bare repo', () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    let git: (operation: Init | Commit) => Promise<void>

    beforeEach(async () => {
      git = repo(repoPath)
      await git(Init.normalRepo())
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

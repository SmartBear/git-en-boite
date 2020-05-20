import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Author } from 'git-en-boite-core'
import { Commit, Init } from 'git-en-boite-core-port-git'
import { containsString, fulfilled, hasProperty, promiseThat } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitRepo } from '../git_repo'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

describe('handleCommit', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitRepo(repoPath)
    const commandBus = new CommandBus<GitRepo, Init | Commit>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(Commit, handleCommit)
    return commandBus.do.bind(commandBus)
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

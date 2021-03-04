import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, messageDispatch } from 'git-en-boite-message-dispatch'
import { Init } from '../operations'
import { fulfilled, hasProperty, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>]

describe('handleInit', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const openRepo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return messageDispatch<Protocol>().withHandlers(repo, [[Init, handleInit]])
  }

  it('creates a new bare repo with conservative garbage collection settings', async () => {
    const repopath = path.resolve(root, 'a-repo-id')
    const git = openRepo(repopath)
    await git(Init.bareRepo())
    await promiseThat(
      exec('git config --get core.bare', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('true')))
    )
    await promiseThat(
      exec('git config --get gc.auto', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('0')))
    )
    await promiseThat(
      exec('git config --get gc.pruneexpire', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('never')))
    )
  })

  it('configures default user name and email', async () => {
    const repopath = path.resolve(root, 'a-repo-id')
    const git = openRepo(repopath)
    await git(Init.bareRepo())
    await promiseThat(
      exec('git config --get user.name', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('Git en boîte')))
    )
    await promiseThat(
      exec('git config --get user.email', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('git-en-boite-devs@smartbear.com')))
    )
  })
})

import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, messageDispatch } from 'git-en-boite-command-bus'
import { Init, SetOrigin } from 'git-en-boite-git-port'
import { fulfilled, hasProperty, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'
import { handleSetOrigin } from './handleSetOrigin'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>, AsyncCommand<SetOrigin>]

describe('handleSetOrigin', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return messageDispatch<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
    ])
  }

  it('creates a remote called origin pointing to the URL', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = 'https://token@host.com/repo'
    await git(SetOrigin.toUrl(repoUrl))
    await promiseThat(
      exec('git remote get-url origin', { cwd: repoPath }),
      fulfilled(hasProperty('stdout', startsWith(repoUrl))),
    )
  })
})

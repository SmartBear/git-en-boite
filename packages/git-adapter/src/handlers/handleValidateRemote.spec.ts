import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, messageDispatch } from 'git-en-boite-command-bus'
import { Init, ValidateRemote } from 'git-en-boite-git-port'
import { promiseThat, rejected, fulfilled } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'
import { handleValidateRemote } from './handleValidateRemote'

type Protocol = [AsyncCommand<Init>, AsyncCommand<ValidateRemote>]

describe('handleValidateRemote', () => {
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
      [ValidateRemote, handleValidateRemote],
    ])
  }

  it('fails if the remote Url returns 404', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = 'https://token@host.com/repo'
    await promiseThat(git(ValidateRemote.url(repoUrl)), rejected())
  })

  it('works if the remote Url is valid', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = 'https://github.com/smartbear/git-en-boite.git'
    await promiseThat(git(ValidateRemote.url(repoUrl)), fulfilled())
  })

  it('fails if the remote Url requires authentication', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = 'https://github.com/smartbear/git-en-boite-test-private.git'
    await promiseThat(git(ValidateRemote.url(repoUrl)), rejected())
  })
})

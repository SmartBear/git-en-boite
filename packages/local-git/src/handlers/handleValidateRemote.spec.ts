import fs from 'fs'
import { RemoteUrl } from 'git-en-boite-core'
import { AsyncCommand, messageDispatch } from 'git-en-boite-message-dispatch'
import { fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleInit, handleValidateRemote } from '.'
import { GitDirectory } from '../git_directory'
import { Init, ValidateRemote } from '../operations'

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

  it('fails if the remote Url returns 404 @slow', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = RemoteUrl.of('https://token@host.com/repo')
    await promiseThat(git(ValidateRemote.url(repoUrl)), rejected())
  }).timeout(5000)

  it('works if the remote Url is valid @slow', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = RemoteUrl.of('https://github.com/smartbear/git-en-boite.git')
    await promiseThat(git(ValidateRemote.url(repoUrl)), fulfilled())
  }).timeout(5000)

  it('fails if the remote Url requires authentication @slow', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = RemoteUrl.of('https://github.com/smartbear/git-en-boite-test-private.git')
    await promiseThat(git(ValidateRemote.url(repoUrl)), rejected())
  }).timeout(5000)
})

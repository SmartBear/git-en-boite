import fs from 'fs'
import { AccessDenied, NotFound, RemoteUrl, RepoId } from 'git-en-boite-core'
import { AsyncCommand, messageDispatch } from 'git-en-boite-message-dispatch'
import { fulfilled, instanceOf, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { runGitHttpServer } from '../test/run_git_http_server'
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

  const remoteUrl = runGitHttpServer(() => root, {
    authenticate: ({ repo }: { repo: string }) =>
      new Promise((resolve, reject) =>
        repo.match(/private/) ? reject('Access denied') : resolve(),
      ),
  })

  beforeEach(async () => {
    const originPath = path.resolve(root, 'origin')
    const origin = await repo(originPath)
    await origin(Init.bareRepo())
  })

  it('works if the remote URL is valid', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(git(ValidateRemote.url(remoteUrl(RepoId.of('origin')))), fulfilled())
  })

  it('fails if the remote URL returns 404', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(
      git(ValidateRemote.url(remoteUrl(RepoId.of('no-such-repo')))),
      rejected(instanceOf(NotFound)),
    )
  })

  it('fails if the remote URL requires authentication', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(
      git(ValidateRemote.url(remoteUrl(RepoId.of('a-private-repo')))),
      rejected(instanceOf(AccessDenied)),
    )
  })
})

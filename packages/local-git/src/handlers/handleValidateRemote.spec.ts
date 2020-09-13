import fs from 'fs'
import { RemoteUrl } from 'git-en-boite-core'
import { AsyncCommand, messageDispatch } from 'git-en-boite-message-dispatch'
import { fulfilled, hasProperty, matchesPattern, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import Server from 'node-git-server'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any
  beforeEach(async () => {
    server = new Server(root, {
      autoCreate: false,
      authenticate: ({ repo }: { repo: string }) =>
        new Promise((resolve, reject) =>
          repo.match(/private/) ? reject('Access denied') : resolve(),
        ),
    })
    await new Promise(started => server.listen(4000, started))
  })
  afterEach(async () => {
    await server.close().catch(() => {
      // ignore any error
    })
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
    const repoUrl = RemoteUrl.of('http://localhost:4000/origin')
    await promiseThat(git(ValidateRemote.url(repoUrl)), fulfilled())
    await server.close()
  })

  it('fails if the remote URL returns 404', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = RemoteUrl.of('http://localhost:4000/no-such-repo')
    await promiseThat(
      git(ValidateRemote.url(repoUrl)),
      rejected(hasProperty('message', matchesPattern('repository not found'))),
    )
  })

  it('fails if the remote URL requires authentication', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = RemoteUrl.of('http://localhost:4000/a-private-repo')
    await promiseThat(
      git(ValidateRemote.url(repoUrl)),
      rejected(hasProperty('message', matchesPattern('terminal prompts disabled'))),
    )
  })
})

import fs from 'fs'
import { AccessDenied, InvalidRepoUrl, RemoteUrl, RepoId } from 'git-en-boite-core'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { fulfilled, instanceOf, promiseThat, rejected } from 'hamjest'
import { Suite } from 'mocha'
import path from 'path'
import { dirSync } from 'tmp'

import { handleInit, handleValidateRemote } from '.'
import { GitDirectory } from '../git_directory'
import { Init, ValidateRemote } from '../operations'
import { runGitHttpServer } from '../test/run_git_http_server'

type Protocol = [AsyncCommand<Init>, AsyncCommand<ValidateRemote>]
type GitOperationType = 'push' | 'fetch'

describe('handleValidateRemote', function () {
  const root = dirSync().name
  const originPath = path.resolve(root, 'origin')

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
    authenticate: ({ type, repo }: { type: GitOperationType; repo: string }) =>
      new Promise((resolve, reject) => {
        if (repo.match(/private/)) return reject('Access denied')
        if (type === 'push' && repo.match(/read-only/)) return reject('Write access denied')
        resolve()
      }),
  })

  beforeEach(async () => {
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
      rejected(instanceOf(InvalidRepoUrl)),
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

  it('fails if the remote URL does not allow for write access', async () => {
    const repoId = RepoId.of('a-read-only-repo')
    const repoPath = path.resolve(root, repoId.value)
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(
      git(ValidateRemote.url(remoteUrl(repoId))),
      rejected(instanceOf(AccessDenied)),
    )
  })

  it('cleans up after committing a test branch to check write permission', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(git(ValidateRemote.url(remoteUrl(RepoId.of('origin')))), fulfilled())

    const remoteRepo = new GitDirectory(originPath)
    // Git exits with 1 when the ref listing is empty, let's expect that:
    await promiseThat(remoteRepo.read('show-ref', []), rejected())
  })

  it('fails if the remote URL does not appear to be a repository', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    await promiseThat(
      git(ValidateRemote.url(RemoteUrl.of('a-bad-url'))),
      rejected(instanceOf(InvalidRepoUrl)),
    )
  })

  xcontext('for real provider URLs @slow', function (this: Suite) {
    let git: Dispatch<Protocol>
    this.timeout(3000)

    beforeEach(async () => {
      git = repo(path.resolve(root, 'a-repo-id'))
      await git(Init.bareRepo())
    })

    context('gitlab.com', () => {
      it('works for a public repo URL', () =>
        promiseThat(
          git(
            ValidateRemote.url(
              RemoteUrl.of('https://gitlab.com/mattwynne/git-en-boite-public.git'),
            ),
          ),
          fulfilled(),
        ))

      it('throws AccessDenied for a non-existent but valid-looking repo URL', () =>
        promiseThat(
          git(
            ValidateRemote.url(
              RemoteUrl.of('https://gitlab.com/mattwynne/git-en-boite-private.git'),
            ),
          ),
          rejected(instanceOf(AccessDenied)),
        ))

      it('throws NotFound for a nonsense URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://gitlab.com/mattwynne.git'))),
          rejected(instanceOf(InvalidRepoUrl)),
        ))
    })

    context('bitbucket.org', () => {
      it('works for a public repo URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://bitbucket.org/git-en-boite/public.git'))),
          fulfilled(),
        ))

      it('throws AccessDenied for a private repo URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://bitbucket.org/git-en-boite/private.git'))),
          rejected(instanceOf(AccessDenied)),
        ))

      it('throws NotFound for a nonsense URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://bitbucket.org/not-a-repo.git'))),
          rejected(instanceOf(InvalidRepoUrl)),
        ))
    })

    context('github.com', () => {
      it('throws NotFound for a nonsense URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://github.com/not-a-repo.git'))),
          rejected(instanceOf(InvalidRepoUrl)),
        ))

      it('throws AccessDenied for a non-existent but valid-looking repo URL', () =>
        promiseThat(
          git(ValidateRemote.url(RemoteUrl.of('https://github.com/smartbear/not-a-repo.git'))),
          rejected(instanceOf(AccessDenied)),
        ))

      it('throws AccessDenied for a private repo', () =>
        promiseThat(
          git(
            ValidateRemote.url(
              RemoteUrl.of('https://github.com/smartbear/git-en-boite-test-private.git'),
            ),
          ),
          rejected(instanceOf(AccessDenied)),
        ))
    })
  })
})

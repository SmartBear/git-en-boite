import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, messageDispatch } from 'git-en-boite-message-dispatch'
import { Commit, Fetch, GetRevision, Init, SetOrigin } from '../operations'
import {
  assertThat,
  equalTo,
  hasProperty,
  isRejectedWith,
  matchesPattern,
  promiseThat,
  startsWith,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { NonBareRepoFactory } from '..'
import { GitDirectory } from '../git_directory'
import { handleFetch } from './handleFetch'
import { handleInit } from './handleInit'
import { handleSetOrigin } from './handleSetOrigin'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>, AsyncCommand<SetOrigin>, AsyncCommand<Fetch>]

describe('handleFetch', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  context('an origin repo with commits on master', () => {
    let latestCommit: string
    let originUrl: string

    beforeEach(async () => {
      originUrl = path.resolve(root, 'remote', 'a-repo-id')
      const origin = await new NonBareRepoFactory().open(originUrl)
      await origin(Commit.withAnyMessage())
      latestCommit = await origin(GetRevision.forBranchNamed('master'))
    })

    const openRepo = (repoPath: string) => {
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitDirectory(repoPath)
      return messageDispatch<Protocol>().withHandlers(repo, [
        [Init, handleInit],
        [SetOrigin, handleSetOrigin],
        [Fetch, handleFetch],
      ])
    }

    it('fetches the lastest commit from the origin remote', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = openRepo(repoPath)
      await git(Init.bareRepo())
      await git(SetOrigin.toUrl(originUrl))
      await git(Fetch.fromOrigin())
      const { stdout } = await exec('git rev-parse refs/remotes/origin/master', { cwd: repoPath })
      assertThat(stdout, startsWith(latestCommit))
    })

    it('fetches only 1 commit from the origin remote', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = openRepo(repoPath)
      await git(Init.bareRepo())
      await git(SetOrigin.toUrl(originUrl))
      await git(Fetch.fromOrigin())
      const { stdout } = await exec('git rev-list --count refs/remotes/origin/master', {
        cwd: repoPath,
      })
      assertThat(stdout.trim(), equalTo('1'))
    })

    it('fails when the remote does not exist', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = openRepo(repoPath)
      await git(Init.bareRepo())
      await git(SetOrigin.toUrl('invalid-remote-url'))
      await promiseThat(
        git(Fetch.fromOrigin()),
        isRejectedWith(
          hasProperty('message', matchesPattern('does not appear to be a git repository')),
        ),
      )
    })
  })
})

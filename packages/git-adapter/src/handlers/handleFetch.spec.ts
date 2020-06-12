import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, commandBus } from 'git-en-boite-command-bus'
import { Commit, Fetch, GetRevision, Init, SetOrigin } from 'git-en-boite-git-port'
import {
  fulfilled,
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
      return commandBus<Protocol>().withHandlers(repo, [
        [Init, handleInit],
        [SetOrigin, handleSetOrigin],
        [Fetch, handleFetch],
      ])
    }

    it('fetches commits from the origin remote', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = openRepo(repoPath)
      await git(Init.bareRepo())
      await git(SetOrigin.toUrl(originUrl))
      await git(Fetch.fromOrigin())
      await promiseThat(
        exec('git rev-parse refs/remotes/origin/master', { cwd: repoPath }),
        fulfilled(hasProperty('stdout', startsWith(latestCommit))),
      )
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

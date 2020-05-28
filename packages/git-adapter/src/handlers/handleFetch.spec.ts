import fs from 'fs'
import childProcess from 'child_process'
import { CommandBus } from 'git-en-boite-command-bus'
import { Init, Commit, GetRevision, SetOrigin, Fetch } from 'git-en-boite-git-port'
import {
  fulfilled,
  hasProperty,
  promiseThat,
  startsWith,
  isRejectedWith,
  matchesPattern,
} from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'
import { handleFetch } from './handleFetch'
import { TestableGitRepoFactory } from '../index'
import { handleSetOrigin } from './handleSetOrigin'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

describe('handleFetch', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  context('an origin repo with commits on master', () => {
    let latestCommit: string
    let originUrl: string

    beforeEach(async () => {
      originUrl = path.resolve(root, 'remote', 'a-repo-id')
      const origin = await new TestableGitRepoFactory().open(originUrl)
      await origin(Init.normalRepo())
      await origin(Commit.withAnyMessage())
      latestCommit = await origin(GetRevision.forBranchNamed('master'))
    })

    const repo = (repoPath: string) => {
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitDirectory(repoPath)
      const commandBus = new CommandBus<GitDirectory, Init | SetOrigin | Fetch>(repo)
      commandBus
        .handle(Init, handleInit)
        .handle(SetOrigin, handleSetOrigin)
        .handle(Fetch, handleFetch)
      return commandBus.dispatch.bind(commandBus)
    }

    it('fetches commits from the origin remote', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = repo(repoPath)
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
      const git = repo(repoPath)
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

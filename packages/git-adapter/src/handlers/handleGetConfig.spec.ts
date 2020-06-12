import { GitProcess } from 'dugite'
import fs from 'fs'
import { AsyncCommand, AsyncQuery, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import { Commit, GetRefs, Init, GetConfig, Config } from 'git-en-boite-git-port'
import { equalTo, fulfilled, promiseThat, rejected, assertThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleGetRefs } from './handleGetRefs'
import { handleInit } from './handleInit'
import { handleGetConfig } from '.'

type Protocol = [AsyncCommand<Init>, AsyncQuery<GetConfig, Config>]

describe('handleGetConfig', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const openRepo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return commandBus<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [GetConfig, handleGetConfig],
    ])
  }

  let git: Dispatch<Protocol>

  context('in a non-bare repo', () => {
    let repoPath: string

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await openRepo(repoPath)
      await git(Init.nonBareRepo())
    })

    it('returns a list include core.bare=false', async () => {
      const config = await git(GetConfig.forRepo())
      assertThat(config['core.bare'], equalTo('false'))
    })
  })

  context('in a bare repo', () => {
    beforeEach(async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      git = openRepo(repoPath)
      await git(Init.bareRepo())
    })

    it('returns a list include core.bare=true', async () => {
      const config = await git(GetConfig.forRepo())
      assertThat(config['core.bare'], equalTo('true'))
    })
  })
})

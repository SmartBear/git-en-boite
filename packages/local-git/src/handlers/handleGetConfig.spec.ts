import fs from 'fs'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { Config, GetConfig, Init } from '../operations'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleGetConfig } from '.'
import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'

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
    return messageDispatch<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [GetConfig, handleGetConfig],
    ])
  }

  let git: Dispatch<Protocol>

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

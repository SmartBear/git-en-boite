import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Init, SetOrigin } from 'git-en-boite-core-port-git'
import { fulfilled, hasProperty, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitRepo } from '../git_repo'
import { handleInit } from './handleInit'
import { handleSetOrigin } from './handleSetOrigin'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

describe('handleSetOrigin', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  it('creates a remote called origin pointing to the URL', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitRepo(repoPath)
    const commandBus = new CommandBus<GitRepo, Init | SetOrigin>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(SetOrigin, handleSetOrigin)
    await commandBus.do(Init.bareRepo())
    const repoUrl = 'https://token@host.com/repo'
    await commandBus.do(SetOrigin.toUrl(repoUrl))
    await promiseThat(
      exec('git remote get-url origin', { cwd: repoPath }),
      fulfilled(hasProperty('stdout', startsWith(repoUrl))),
    )
  })
})

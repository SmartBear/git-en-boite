import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Init, SetOrigin } from 'git-en-boite-core-port-git'
import { fulfilled, hasProperty, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'
import { handleSetOrigin } from './handleSetOrigin'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

describe('handleSetOrigin', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const commandBus = new CommandBus<GitDirectory, Init | SetOrigin>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(SetOrigin, handleSetOrigin)
    return commandBus.do.bind(commandBus)
  }

  it('creates a remote called origin pointing to the URL', async () => {
    const repoPath = path.resolve(root, 'a-repo-id')
    const git = repo(repoPath)
    await git(Init.bareRepo())
    const repoUrl = 'https://token@host.com/repo'
    await git(SetOrigin.toUrl(repoUrl))
    await promiseThat(
      exec('git remote get-url origin', { cwd: repoPath }),
      fulfilled(hasProperty('stdout', startsWith(repoUrl))),
    )
  })
})

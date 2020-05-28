import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Init } from 'git-en-boite-git-port'
import { fulfilled, hasProperty, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')
console.log(root)

describe('handleInit', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const commandBus = new CommandBus<GitDirectory, Init>(repo)
    commandBus.handle(Init, handleInit)
    return commandBus.dispatch.bind(commandBus)
  }

  it('creates a new bare repo with conservative garbage collection settings', async () => {
    const repopath = path.resolve(root, 'a-repo-id')
    const git = repo(repopath)
    await git(Init.bareRepo())
    await promiseThat(
      exec('git config --get core.bare', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('true'))),
    )
    await promiseThat(
      exec('git config --get gc.auto', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('0'))),
    )
    await promiseThat(
      exec('git config --get gc.pruneexpire', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('never'))),
    )
  })

  it('configures default user name and email', async () => {
    const repopath = path.resolve(root, 'a-repo-id')
    const git = repo(repopath)
    await git(Init.bareRepo())
    await promiseThat(
      exec('git config --get user.name', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('Git en boîte'))),
    )
    await promiseThat(
      exec('git config --get user.email', { cwd: repopath }),
      fulfilled(hasProperty('stdout', startsWith('git-en-boite-devs@smartbear.com'))),
    )
  })
})

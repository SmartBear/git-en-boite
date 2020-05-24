import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Commit, Init, EnsureBranchExists } from 'git-en-boite-core-port-git'
import { fulfilled, promiseThat, rejected, containsInAnyOrder } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')
type Operation = Init | Commit | EnsureBranchExists

describe('handleEnsureBranchExists', () => {
  const repoPath = path.resolve(root, 'a-repo-id')
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const commandBus = new CommandBus<GitDirectory, Operation>(repo)
    commandBus
      .handle(Init, handleInit)
      .handle(Commit, handleCommit)
      .handle(EnsureBranchExists, handleEnsureBranchExists)
    return commandBus.do.bind(commandBus)
  }

  const branchesFound = async () => {
    const result = await exec('git branch --list --format="%(refname:short)"', { cwd: repoPath })
    return result.stdout.trim().split('\n')
  }

  context('in a non-bare repo', () => {
    let git: (operation: Operation) => Promise<void>

    beforeEach(async () => {
      git = repo(repoPath)
      await git(Init.normalRepo())
    })

    context('with no commits in the repo', () => {
      it('fails', async () => {
        await promiseThat(git(EnsureBranchExists.named('master')), rejected())
      })
    })

    context('with a commit on the master branch', () => {
      it('creates a new branch', async () => {
        await git(Commit.withAnyMessage())
        await git(EnsureBranchExists.named('develop'))
        await promiseThat(branchesFound(), fulfilled(containsInAnyOrder('develop', 'master')))
      })

      it('leaves the master branch', async () => {
        await git(Commit.withAnyMessage())
        await git(EnsureBranchExists.named('master'))
        await promiseThat(branchesFound(), fulfilled(containsInAnyOrder('master')))
      })
    })
  })
})

import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Commit, Init, EnsureBranchExists, GetRevision } from 'git-en-boite-core-port-git'
import { fulfilled, promiseThat, rejected, equalTo } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'
import { handleGetRevision } from './handleGetRevision'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')
type Operation = Init | Commit | GetRevision | EnsureBranchExists

describe('handleGetRevision', () => {
  const repoPath = path.resolve(root, 'a-repo-id')
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const commandBus = new CommandBus<GitDirectory, Operation>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(Commit, handleCommit)
    commandBus.handle(GetRevision, handleGetRevision)
    commandBus.handle(EnsureBranchExists, handleEnsureBranchExists)
    return commandBus.do.bind(commandBus)
  }

  const revisionForBranch = async (branchName: string) => {
    const result = await exec(`git rev-parse ${branchName}`, { cwd: repoPath })
    return result.stdout.trim()
  }

  context('in a non-bare repo', () => {
    let git: (operation: Operation) => Promise<void>

    beforeEach(async () => {
      git = repo(repoPath)
      await git(Init.normalRepo())
    })

    context('with no commits in the repo', () => {
      it('fails', async () => {
        await promiseThat(git(GetRevision.forCurrentBranch()), rejected())
      })
    })

    context('with a commit to the master branch', () => {
      beforeEach(async () => {
        await git(Commit.withAnyMessage())
      })

      it('returns the revision of the latest commit', async () => {
        await promiseThat(
          git(GetRevision.forCurrentBranch()),
          fulfilled(equalTo(await revisionForBranch('master'))),
        )
      })
    })
  })
})

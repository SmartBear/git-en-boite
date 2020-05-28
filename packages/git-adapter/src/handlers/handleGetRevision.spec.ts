import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Commit, Init, EnsureBranchExists, GetRevision } from 'git-en-boite-git-port'
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
    commandBus
      .handle(Init, handleInit)
      .handle(Commit, handleCommit)
      .handle(GetRevision, handleGetRevision)
      .handle(EnsureBranchExists, handleEnsureBranchExists)
    return commandBus.dispatch.bind(commandBus)
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
        await promiseThat(git(GetRevision.forBranchNamed('master')), rejected())
      })
    })

    context('with a commit to the master branch', () => {
      beforeEach(async () => {
        await git(Commit.withAnyMessage())
      })

      it('returns the revision of the latest commit', async () => {
        await promiseThat(
          git(GetRevision.forBranchNamed('master')),
          fulfilled(equalTo(await revisionForBranch('master'))),
        )
      })
    })
  })
})

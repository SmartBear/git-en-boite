import childProcess from 'child_process'
import { GitProcess } from 'dugite'
import fs from 'fs'
import { commandBus, AsyncCommand, Dispatch } from 'git-en-boite-command-bus'
import { Commit, EnsureBranchExists, Init } from 'git-en-boite-git-port'
import { containsInAnyOrder, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')

describe('handleEnsureBranchExists', () => {
  const repoPath = path.resolve(root, 'a-repo-id')
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncCommand<EnsureBranchExists>]

  const openRepo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return commandBus<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
      [EnsureBranchExists, handleEnsureBranchExists],
    ])
  }

  const branchesFound = async () => {
    const result = await GitProcess.exec(
      ['branch', '--list', '--format=%(refname:short)'],
      repoPath,
    )
    return result.stdout.trim().split('\n')
  }

  context('in a non-bare repo', () => {
    let git: Dispatch<Protocol>

    beforeEach(async () => {
      git = openRepo(repoPath)
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

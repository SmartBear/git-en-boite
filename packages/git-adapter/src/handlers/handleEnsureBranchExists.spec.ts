import childProcess from 'child_process'
import { GitProcess } from 'dugite'
import fs from 'fs'
import { AsyncCommand, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Commit, EnsureBranchExists, Init } from 'git-en-boite-git-port'
import { containsInAnyOrder, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'
import { handleInit } from './handleInit'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncCommand<EnsureBranchExists>]

describe('handleEnsureBranchExists', () => {
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
      [Commit, handleCommit],
      [EnsureBranchExists, handleEnsureBranchExists],
    ])
  }

  const branchesFoundIn = async (repoPath: string) => {
    const result = await GitProcess.exec(
      ['branch', '--list', '--format=%(refname:short)'],
      repoPath,
    )
    return result.stdout.trim().split('\n')
  }

  context('in a non-bare repo', () => {
    let git: Dispatch<Protocol>
    let repoPath: string

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await openRepo(repoPath)
      await git(Init.nonBareRepo())
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
        await promiseThat(
          branchesFoundIn(repoPath),
          fulfilled(containsInAnyOrder('develop', 'master')),
        )
      })

      it('leaves the master branch', async () => {
        await git(Commit.withAnyMessage())
        await git(EnsureBranchExists.named('master'))
        await promiseThat(branchesFoundIn(repoPath), fulfilled(containsInAnyOrder('master')))
      })
    })
  })
})

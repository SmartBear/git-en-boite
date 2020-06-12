import childProcess from 'child_process'
import fs from 'fs'
import { AsyncCommand, AsyncQuery, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Commit, EnsureBranchExists, GetRevision, Init } from 'git-en-boite-git-port'
import { equalTo, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleEnsureBranchExists } from './handleEnsureBranchExists'
import { handleGetRevision } from './handleGetRevision'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)

type Protocol = [
  AsyncCommand<Init>,
  AsyncCommand<Commit>,
  AsyncQuery<GetRevision, string>,
  AsyncCommand<EnsureBranchExists>,
]

describe('handleGetRevision', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    return commandBus<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [Commit, handleCommit],
      [GetRevision, handleGetRevision],
      [EnsureBranchExists, handleEnsureBranchExists],
    ])
  }

  const revisionForBranch = async (branchName: string, repoPath: string) => {
    const result = await exec(`git rev-parse ${branchName}`, { cwd: repoPath })
    return result.stdout.trim()
  }

  context('in a non-bare repo', () => {
    let git: Dispatch<Protocol>
    let repoPath: string

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await repo(repoPath)
      await git(Init.nonBareRepo())
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
          fulfilled(equalTo(await revisionForBranch('master', repoPath))),
        )
      })
    })
  })
})

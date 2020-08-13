import childProcess from 'child_process'
import fs from 'fs'
import { LocalCommitRef } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { equalTo, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { Commit, GetRevision, Init } from '../operations'
import { handleCommit } from './handleCommit'
import { handleGetRevision } from './handleGetRevision'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<GetRevision, string>]

const repo = (repoPath: string) => {
  fs.mkdirSync(repoPath, { recursive: true })
  const repo = new GitDirectory(repoPath)
  return messageDispatch<Protocol>().withHandlers(repo, [
    [Init, handleInit],
    [Commit, handleCommit],
    [GetRevision, handleGetRevision],
  ])
}

const revisionForBranch = async (branchName: string, repoPath: string) => {
  const result = await exec(`git rev-parse ${branchName}`, { cwd: repoPath })
  return result.stdout.trim()
}

// TODO: remove this - just use GetRefs
describe('handleGetRevision', () => {
  const branchName = 'main'

  let root: string
  let git: Dispatch<Protocol>
  let repoPath: string

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    git = await repo(repoPath)
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  context('with no commits in the repo', () => {
    it('fails', async () => {
      await promiseThat(git(GetRevision.forBranchNamed(branchName)), rejected())
    })
  })

  context('with a commit to the main branch', () => {
    beforeEach(async () => {
      await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    })

    it('returns the revision of the latest commit', async () => {
      await promiseThat(
        git(GetRevision.forBranchNamed(branchName)),
        fulfilled(equalTo(await revisionForBranch(branchName, repoPath))),
      )
    })
  })
})

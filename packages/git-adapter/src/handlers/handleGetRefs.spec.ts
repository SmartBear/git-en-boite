import { GitProcess } from 'dugite'
import fs from 'fs'
import { AsyncCommand, AsyncQuery, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import { Commit, GetRefs, Init } from 'git-en-boite-git-port'
import { equalTo, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleGetRefs } from './handleGetRefs'
import { handleInit } from './handleInit'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<GetRefs, Ref[]>]

describe('handleGetRefs', () => {
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
      [GetRefs, handleGetRefs],
    ])
  }

  const revisionForBranch = async (branchName: string, repoPath: string) => {
    const result = await GitProcess.exec(['rev-parse', branchName], repoPath)
    return result.stdout.trim()
  }

  let git: Dispatch<Protocol>

  context('in a non-bare repo', () => {
    let repoPath: string

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = await openRepo(repoPath)
      await git(Init.nonBareRepo())
    })

    context('with no commits in the repo', () => {
      it('fails', async () => {
        await promiseThat(git(GetRefs.all()), rejected())
      })
    })

    context('with a commit to the master branch', () => {
      beforeEach(async () => {
        await git(Commit.withAnyMessage())
      })

      it('returns the revision of the latest commit', async () => {
        await promiseThat(
          git(GetRefs.all()),
          fulfilled(
            equalTo([new Ref(await revisionForBranch('master', repoPath), 'refs/heads/master')]),
          ),
        )
      })
    })
  })

  context('in a bare repo', () => {
    beforeEach(async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      git = openRepo(repoPath)
      await git(Init.bareRepo())
    })

    context('with a remote branch', () => {
      it('returns a ref for the remote branch')
    })
  })
})

import { GitProcess } from 'dugite'
import fs from 'fs'
import { LocalCommitRef, Ref } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, fulfilled, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GitDirectory } from '../git_directory'
import { Commit, GetRefs, Init } from '../operations'
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

  const revParse = async (refName: string, repoPath: string) => {
    const result = await GitProcess.exec(['rev-parse', refName], repoPath)
    return result.stdout.trim()
  }

  let git: Dispatch<Protocol>

  context('in a bare repo', () => {
    let repoPath: string

    const openRepo = (repoPath: string) => {
      fs.mkdirSync(repoPath, { recursive: true })
      const repo = new GitDirectory(repoPath)
      return messageDispatch<Protocol>().withHandlers(repo, [
        [Init, handleInit],
        [Commit, handleCommit],
        [GetRefs, handleGetRefs],
      ])
    }

    beforeEach(async () => {
      repoPath = path.resolve(root, 'a-repo-id')
      git = openRepo(repoPath)
      await git(Init.bareRepo())
    })

    it('returns an empty array when there are no commits', async () => {
      assertThat(await git(GetRefs.all()), equalTo([]))
    })

    context('with a commit to the main branch', () => {
      const branchName = 'a-branch'
      const commitRef = LocalCommitRef.forBranch(branchName)

      beforeEach(async () => {
        await git(Commit.toCommitRef(commitRef))
      })

      it('returns the revision of the latest commit', async () => {
        const revision = await revParse(commitRef.local, repoPath)
        await promiseThat(
          git(GetRefs.all()),
          fulfilled(equalTo([new Ref(revision, commitRef.local)])),
        )
      })
    })
  })
})

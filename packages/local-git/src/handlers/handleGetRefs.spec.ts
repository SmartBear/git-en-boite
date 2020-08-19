import fs from 'fs'
import { Ref, Refs, BranchName } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, fulfilled, promiseThat } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleCommit, handleGetRefs, handleInit } from '.'
import { LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { Commit, GetRefs, Init } from '../operations'

type Protocol = [AsyncCommand<Init>, AsyncCommand<Commit>, AsyncQuery<GetRefs, Refs>]

describe('handleGetRefs', () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  let git: Dispatch<Protocol>

  context('in a bare repo', () => {
    let repoPath: string
    let repo: GitDirectory

    const openRepo = (repoPath: string) => {
      fs.mkdirSync(repoPath, { recursive: true })
      repo = new GitDirectory(repoPath)
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
      const branchName = BranchName.of('a-branch')
      const commitRef = LocalCommitRef.forBranch(branchName)

      beforeEach(async () => {
        await git(Commit.toCommitRef(commitRef))
      })

      it('returns the revision of the latest commit', async () => {
        const revision = await repo.read('rev-parse', [commitRef.local.value])
        await promiseThat(
          git(GetRefs.all()),
          fulfilled(equalTo([new Ref(revision, commitRef.local)])),
        )
      })
    })
  })
})

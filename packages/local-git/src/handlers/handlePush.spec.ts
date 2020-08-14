import fs from 'fs'
import { PendingCommitRef, Refs } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, not } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import {
  handleCommit,
  handleFetch,
  handleGetRefs,
  handleInit,
  handlePush,
  handleSetOrigin,
} from '.'
import { LocalCommitRef } from '..'
import { BareRepoFactory } from '../bare_repo_factory'
import { GitDirectory } from '../git_directory'
import { Commit, Fetch, GetRefs, Init, Push, SetOrigin } from '../operations'

type Protocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Init>,
  AsyncCommand<Fetch>,
  AsyncCommand<Push>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Refs>,
]

describe('handlePush', () => {
  const branchName = 'a-branch'
  let root: string
  let repoPath: string
  let originUrl: string
  let git: Dispatch<Protocol>
  let repo: GitDirectory

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    originUrl = path.resolve(root, 'remote', 'a-repo-id')
    fs.mkdirSync(repoPath, { recursive: true })
    repo = new GitDirectory(repoPath)
    git = messageDispatch<Protocol>().withHandlers(repo, [
      [Commit, handleCommit],
      [Init, handleInit],
      [Fetch, handleFetch],
      [Push, handlePush],
      [SetOrigin, handleSetOrigin],
      [GetRefs, handleGetRefs],
    ])
    await git(Init.bareRepo())
  })

  it('pushes a commit to origin', async () => {
    const origin = await new BareRepoFactory().open(originUrl)
    await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    const { revision: firstCommit } = (await origin(GetRefs.all())).forBranch(branchName)
    await git(SetOrigin.toUrl(originUrl))
    await git(Fetch.fromOrigin())

    const file = { path: 'a.file', content: 'some content' }
    const commitRef = PendingCommitRef.forBranch(branchName)
    await git(Commit.toCommitRef(commitRef).withFiles([file]))
    const { revision: newCommit } = (await git(GetRefs.all())).forBranch(branchName)
    assertThat(firstCommit, not(equalTo(newCommit)))

    await git(Push.pendingCommitFrom(commitRef))
    const { revision: originCommit } = (await origin(GetRefs.all())).forBranch(branchName)
    assertThat(originCommit, equalTo(newCommit))
  })
})

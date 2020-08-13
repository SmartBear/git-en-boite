import { AsyncCommand, Dispatch, messageDispatch, AsyncQuery } from 'git-en-boite-message-dispatch'
import path from 'path'
import fs from 'fs'
import { dirSync } from 'tmp'

import {
  handleCommit,
  handleFetch,
  handleInit,
  handleSetOrigin,
  handlePush,
  handleGetRefs,
} from '.'
import { BareRepoFactory } from '../bare_repo_factory'
import { GitDirectory } from '../git_directory'
import { Commit, Fetch, Init, SetOrigin, Push, GetRevision, GetRefs } from '../operations'
import { promiseThat, equalTo, fulfilled } from 'hamjest'
import { handleGetRevision } from './handleGetRevision'
import { Ref, PendingCommitRef } from 'git-en-boite-core'

type Protocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Init>,
  AsyncCommand<Fetch>,
  AsyncCommand<Push>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetRevision, string>,
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
      [GetRevision, handleGetRevision],
    ])
    await git(Init.bareRepo())
  })

  it('pushes to remote', async () => {
    const origin = await new BareRepoFactory().open(originUrl)
    await origin(Commit.toRef(`refs/heads/${branchName}`).onBranch(branchName))
    await git(SetOrigin.toUrl(originUrl))
    await git(Fetch.fromOrigin())

    const file = { path: 'a.file', content: 'some content' }
    const commitRef = PendingCommitRef.forBranch(branchName)
    await git(Commit.toRef(commitRef.localRef).withFiles([file]).onBranch(commitRef.branchName))
    await git(Push.pendingCommitFrom(commitRef))
    const commitName = (await git(GetRefs.all())).find(ref => ref.refName === commitRef.localRef)
      .revision

    promiseThat(origin(GetRevision.forBranchNamed(branchName)), fulfilled(equalTo(commitName)))
  })
})

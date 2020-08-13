import fs from 'fs'
import { LocalCommitRef, PendingCommitRef, Ref } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { equalTo, fulfilled, promiseThat } from 'hamjest'
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
import { BareRepoFactory } from '../bare_repo_factory'
import { GitDirectory } from '../git_directory'
import { Commit, Fetch, GetRefs, GetRevision, Init, Push, SetOrigin } from '../operations'
import { handleGetRevision } from './handleGetRevision'

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
    await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    await git(SetOrigin.toUrl(originUrl))
    await git(Fetch.fromOrigin())

    const file = { path: 'a.file', content: 'some content' }
    const commitRef = PendingCommitRef.forBranch(branchName)
    await git(Commit.toCommitRef(commitRef).withFiles([file]))
    await git(Push.pendingCommitFrom(commitRef))
    const commitName = (await git(GetRefs.all())).find(ref => ref.refName === commitRef.local)
      .revision

    promiseThat(origin(GetRevision.forBranchNamed(branchName)), fulfilled(equalTo(commitName)))
  })
})

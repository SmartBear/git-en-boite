import fs from 'fs'
import { BranchName, CommitName, RemoteUrl } from 'git-en-boite-core'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import { equalTo, fulfilled, hasProperty, isRejectedWith, matchesPattern, promiseThat, startsWith } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleFetch, handleInit } from '.'
import { createBareRepo, LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { Commit, Fetch, GetRefs, Init, SetOrigin } from '../operations'
import { handleSetOrigin } from './handleSetOrigin'

type Protocol = [AsyncCommand<Init>, AsyncCommand<SetOrigin>, AsyncCommand<Fetch>]

describe('handleFetch', () => {
  const branchName = BranchName.of('main')
  let root: string
  let latestCommit: CommitName
  let originPath: string
  let git: Dispatch<Protocol>
  let repo: GitDirectory
  let repoPath: string

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    originPath = path.resolve(root, 'remote', 'a-repo-id')

    const origin = await createBareRepo(originPath)
    await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    latestCommit = (await origin(GetRefs.all())).forBranch(branchName).revision
    fs.mkdirSync(repoPath, { recursive: true })
    repo = new GitDirectory(repoPath)
    git = messageDispatch<Protocol>().withHandlers(repo, [
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [Fetch, handleFetch],
    ])
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  it('fetches the lastest commit from the origin remote', async () => {
    await git(SetOrigin.toUrl(RemoteUrl.of(originPath)))
    await git(Fetch.fromOrigin())
    await promiseThat(
      repo.read('rev-parse', [`refs/remotes/origin/${branchName.value}`]),
      fulfilled(startsWith(latestCommit.value))
    )
  })

  it('fetches only 1 commit from the origin remote', async () => {
    await git(SetOrigin.toUrl(RemoteUrl.of(originPath)))
    await git(Fetch.fromOrigin())
    await promiseThat(
      repo.read('rev-list', ['--count', `refs/remotes/origin/${branchName.value}`]),
      fulfilled(equalTo('1'))
    )
  })

  it('fails when the remote does not exist', async () => {
    await git(SetOrigin.toUrl(RemoteUrl.of('invalid-remote-url')))
    await promiseThat(
      git(Fetch.fromOrigin()),
      isRejectedWith(hasProperty('message', matchesPattern('does not appear to be a git repository')))
    )
  })
})

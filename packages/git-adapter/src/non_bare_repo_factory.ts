import fs from 'fs'
import {
  Checkout,
  Commit,
  EnsureBranchExists,
  Fetch,
  GetConfig,
  GetRefs,
  GetRevision,
  Init,
  NonBareRepoProtocol,
  SetOrigin,
} from 'git-en-boite-git-port'
import { Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'

import { GitDirectory } from './git_directory'
import {
  handleCheckout,
  handleCommit,
  handleEnsureBranchExists,
  handleFetch,
  handleGetConfig,
  handleGetRefs,
  handleGetRevision,
  handleInit,
  handleSetOrigin,
} from './handlers'

type NonBareRepo = Dispatch<NonBareRepoProtocol>

export class NonBareRepoFactory {
  async open(path: string): Promise<NonBareRepo> {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    const git = messageDispatch<NonBareRepoProtocol>().withHandlers(repo, [
      [Checkout, handleCheckout],
      [Commit, handleCommit],
      [EnsureBranchExists, handleEnsureBranchExists],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [GetRefs, handleGetRefs],
      [GetRevision, handleGetRevision],
      [GetConfig, handleGetConfig],
    ])
    await git(Init.nonBareRepo())
    await git(Commit.withMessage('Initial commit'))
    return git
  }
}

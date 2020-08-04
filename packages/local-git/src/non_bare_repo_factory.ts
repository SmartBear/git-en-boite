import fs from 'fs'
import { Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'

import { GitDirectory } from './git_directory'
import {
  handleCheckout,
  handleCommit,
  handleEnsureBranchExists,
  handleFetch,
  handleGetConfig,
  handleGetFiles,
  handleGetRefs,
  handleGetRevision,
  handleInit,
  handleSetOrigin,
} from './handlers'
import {
  Checkout,
  Commit,
  EnsureBranchExists,
  Fetch,
  GetConfig,
  GetFiles,
  GetRefs,
  GetRevision,
  Init,
  NonBareRepoProtocol,
  SetOrigin,
} from './operations'

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
      [GetConfig, handleGetConfig],
      [GetFiles, handleGetFiles],
      [GetRefs, handleGetRefs],
      [GetRevision, handleGetRevision],
    ])
    await git(Init.nonBareRepo())
    await git(Commit.withMessage('Initial commit'))
    return git
  }
}

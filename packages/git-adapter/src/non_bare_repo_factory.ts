import fs from 'fs'
import { messageDispatch, Dispatch } from 'git-en-boite-message-dispatch'
import {
  Checkout,
  Commit,
  EnsureBranchExists,
  Fetch,
  GetRefs,
  GetRevision,
  Init,
  NonBareRepoProtocol,
  OpensGitRepos,
  SetOrigin,
  GetConfig,
} from 'git-en-boite-git-port'

import { GitDirectory } from './git_directory'
import {
  handleCheckout,
  handleCommit,
  handleEnsureBranchExists,
  handleFetch,
  handleGetRefs,
  handleGetRevision,
  handleInit,
  handleSetOrigin,
  handleGetConfig,
} from './handlers'

type NonBareRepo = Dispatch<NonBareRepoProtocol>

export class NonBareRepoFactory implements OpensGitRepos<NonBareRepoProtocol> {
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

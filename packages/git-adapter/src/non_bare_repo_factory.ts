import fs from 'fs'
import { commandBus, Dispatch } from 'git-en-boite-command-bus'
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
} from './handlers'

type NonBareRepo = Dispatch<NonBareRepoProtocol>

export class NonBareRepoFactory implements OpensGitRepos<NonBareRepoProtocol> {
  open(path: string): NonBareRepo {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    return commandBus<NonBareRepoProtocol>().withHandlers(repo, [
      [Checkout, handleCheckout],
      [Commit, handleCommit],
      [EnsureBranchExists, handleEnsureBranchExists],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [GetRefs, handleGetRefs],
      [GetRevision, handleGetRevision],
    ])
  }
}

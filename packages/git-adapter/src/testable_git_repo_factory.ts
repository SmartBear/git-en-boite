import fs from 'fs'
import { AsyncCommand, AsyncQuery, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import {
  Checkout,
  Commit,
  EnsureBranchExists,
  Fetch,
  GetRefs,
  GetRevision,
  Init,
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

export type TestableGitRepoProtocol = [
  AsyncCommand<Checkout>,
  AsyncCommand<Commit>,
  AsyncCommand<EnsureBranchExists>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetRevision, string>,
]

type TestableGitRepo = Dispatch<TestableGitRepoProtocol>

export class TestableGitRepoFactory implements OpensGitRepos<TestableGitRepoProtocol> {
  open(path: string): TestableGitRepo {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    return commandBus<TestableGitRepoProtocol>().withHandlers(repo, [
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

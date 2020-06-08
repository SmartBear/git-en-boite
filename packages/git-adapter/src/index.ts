import fs from 'fs'
import { AsyncCommand, AsyncQuery, commandBus, Dispatch } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import {
  Checkout,
  Commit,
  Connect,
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
  handleConnect,
  handleEnsureBranchExists,
  handleFetch,
  handleGetRefs,
  handleGetRevision,
  handleInit,
  handleSetOrigin,
} from './handlers'

type GitRepoProtocol = [
  AsyncCommand<Connect>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
]

export type GitRepo = Dispatch<GitRepoProtocol>

export class GitRepoFactory implements OpensGitRepos<GitRepoProtocol> {
  async open(path: string): Promise<GitRepo> {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    return commandBus<GitRepoProtocol>().withHandlers(repo, [
      [Connect, handleConnect],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [GetRefs, handleGetRefs],
    ])
  }
}

type TestableGitRepoProtocol = [
  AsyncCommand<Checkout>,
  AsyncCommand<Commit>,
  AsyncCommand<EnsureBranchExists>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetRevision, string>,
]

export type TestableGitRepo = Dispatch<TestableGitRepoProtocol>

export class TestableGitRepoFactory implements OpensGitRepos<TestableGitRepoProtocol> {
  async open(path: string): Promise<TestableGitRepo> {
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

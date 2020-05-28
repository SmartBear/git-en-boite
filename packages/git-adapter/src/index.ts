import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import {
  Commit,
  Connect,
  EnsureBranchExists,
  Fetch,
  GetRefs,
  GetRevision,
  GitOperation,
  Init,
  OpensGitRepos,
  OperateGitRepo,
  SetOrigin,
  Checkout,
} from 'git-en-boite-git-port'

import { GitDirectory } from './git_directory'
import {
  handleCommit,
  handleConnect,
  handleCheckout,
  handleEnsureBranchExists,
  handleFetch,
  handleGetRefs,
  handleGetRevision,
  handleInit,
  handleSetOrigin,
} from './handlers'

export class GitRepoFactory implements OpensGitRepos {
  async open(path: string): Promise<OperateGitRepo> {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    const commandBus = new CommandBus<GitDirectory, GitOperation>(repo)
    commandBus
      .handle(Init, handleInit)
      .handle(Connect, handleConnect)
      .handle(SetOrigin, handleSetOrigin)
      .handle(Fetch, handleFetch)
      .handle(GetRefs, handleGetRefs)
    return commandBus.dispatch.bind(commandBus)
  }
}

export class TestableGitRepoFactory implements OpensGitRepos {
  async open(path: string): Promise<OperateGitRepo> {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    const commandBus = new CommandBus<GitDirectory, GitOperation>(repo)
    commandBus
      .handle(Init, handleInit)
      .handle(SetOrigin, handleSetOrigin)
      .handle(Checkout, handleCheckout)
      .handle(Commit, handleCommit)
      .handle(Fetch, handleFetch)
      .handle(EnsureBranchExists, handleEnsureBranchExists)
      .handle(GetRevision, handleGetRevision)
      .handle(GetRefs, handleGetRefs)
    return commandBus.dispatch.bind(commandBus)
  }
}

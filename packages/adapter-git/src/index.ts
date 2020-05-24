import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import {
  Fetch,
  GitOperation,
  Init,
  OpensGitRepos,
  OperateGitRepo,
  SetOrigin,
  Commit,
  EnsureBranchExists,
  GetRevision,
  GetRefs,
} from 'git-en-boite-core-port-git'

import { GitDirectory } from './git_directory'
import {
  handleInit,
  handleSetOrigin,
  handleFetch,
  handleGetRevision,
  handleCommit,
  handleEnsureBranchExists,
  handleGetRefs,
} from './handlers'

export class GitRepoFactory implements OpensGitRepos {
  async open(path: string): Promise<OperateGitRepo> {
    fs.mkdirSync(path, { recursive: true })
    const repo = new GitDirectory(path)
    const commandBus = new CommandBus<GitDirectory, GitOperation>(repo)
    commandBus
      .handle(Init, handleInit)
      .handle(SetOrigin, handleSetOrigin)
      .handle(Fetch, handleFetch)
      .handle(GetRefs, handleGetRefs)
    return commandBus.do.bind(commandBus)
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
      .handle(Commit, handleCommit)
      .handle(Fetch, handleFetch)
      .handle(EnsureBranchExists, handleEnsureBranchExists)
      .handle(GetRevision, handleGetRevision)
    return commandBus.do.bind(commandBus)
  }
}

import fs from 'fs'
import path from 'path'
import { commandBus } from 'git-en-boite-command-bus'
import {
  Connect,
  Fetch,
  GetRefs,
  GitRepo,
  BareRepoProtocol,
  Init,
  OpensGitRepos,
  SetOrigin,
  GetRevision,
  GetConfig,
} from 'git-en-boite-git-port'

import { GitDirectory } from './git_directory'
import {
  handleConnect,
  handleFetch,
  handleGetRefs,
  handleInit,
  handleSetOrigin,
  handleGetConfig,
} from './handlers'

export class BareRepoFactory implements OpensGitRepos<BareRepoProtocol> {
  async open(containingPath: string): Promise<GitRepo> {
    const repoPath = path.resolve(containingPath, 'git')
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const git = commandBus<BareRepoProtocol>().withHandlers(repo, [
      [Connect, handleConnect],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [GetRefs, handleGetRefs],
      [GetConfig, handleGetConfig],
    ])
    await git(Init.bareRepo())
    return git
  }
}

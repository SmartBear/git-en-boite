import fs from 'fs'
import { commandBus } from 'git-en-boite-command-bus'
import {
  BareRepoProtocol,
  Connect,
  Fetch,
  GetConfig,
  GetRefs,
  GitRepo,
  Init,
  OpensGitRepos,
  SetOrigin,
} from 'git-en-boite-git-port'
import path from 'path'

import { GitDirectory } from './git_directory'
import {
  handleConnect,
  handleFetch,
  handleGetConfig,
  handleGetRefs,
  handleInit,
  handleSetOrigin,
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

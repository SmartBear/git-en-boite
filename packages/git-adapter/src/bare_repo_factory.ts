import fs from 'fs'
import { messageDispatch } from 'git-en-boite-message-dispatch'
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
  ValidateRemote,
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
  handleValidateRemote,
} from './handlers'

export class BareRepoFactory implements OpensGitRepos<BareRepoProtocol> {
  async open(containingPath: string): Promise<GitRepo> {
    const repoPath = path.resolve(containingPath, 'git')
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const git = messageDispatch<BareRepoProtocol>().withHandlers(repo, [
      [Connect, handleConnect],
      [Fetch, handleFetch],
      [Init, handleInit],
      [SetOrigin, handleSetOrigin],
      [ValidateRemote, handleValidateRemote],
      [GetRefs, handleGetRefs],
      [GetConfig, handleGetConfig],
    ])
    await git(Init.bareRepo())
    return git
  }
}

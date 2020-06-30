import fs from 'fs'
import {
  BareRepoProtocol,
  Connect,
  Fetch,
  GetConfig,
  GetRefs,
  Init,
  SetOrigin,
  ValidateRemote,
} from 'git-en-boite-git-port'
import { Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
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

type BareRepo = Dispatch<BareRepoProtocol>

export class BareRepoFactory {
  async open(containingPath: string): Promise<BareRepo> {
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

import fs from 'fs'
import { Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import path from 'path'

import { GitDirectory } from './git_directory'
import {
  handleCommitToBareRepo,
  handleConnect,
  handleFetch,
  handleGetConfig,
  handleGetRefs,
  handleInit,
  handleSetOrigin,
  handleValidateRemote,
} from './handlers'
import {
  BareRepoProtocol,
  Commit,
  Connect,
  Fetch,
  GetConfig,
  GetRefs,
  Init,
  SetOrigin,
  ValidateRemote,
} from './operations'

type BareRepo = Dispatch<BareRepoProtocol>

export class BareRepoFactory {
  async open(repoPath: string): Promise<BareRepo> {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const git = messageDispatch<BareRepoProtocol>().withHandlers(repo, [
      [Commit, handleCommitToBareRepo],
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

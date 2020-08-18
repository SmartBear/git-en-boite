import fs from 'fs'
import { Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'

import { GitDirectory } from './git_directory'
import {
  handleCommit,
  handleConnect,
  handleFetch,
  handleGetConfig,
  handleGetFiles,
  handleGetRefs,
  handleInit,
  handlePush,
  handleSetOrigin,
  handleValidateRemote,
} from './handlers'
import {
  BareRepoProtocol,
  Commit,
  Connect,
  Fetch,
  GetConfig,
  GetFiles,
  GetRefs,
  Init,
  Push,
  SetOrigin,
  ValidateRemote,
} from './operations'

type BareRepo = Dispatch<BareRepoProtocol>

export class RepoFactory {
  async open(repoPath: string): Promise<BareRepo> {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const git = messageDispatch<BareRepoProtocol>().withHandlers(repo, [
      [Commit, handleCommit],
      [Connect, handleConnect],
      [Fetch, handleFetch],
      [Init, handleInit],
      [Push, handlePush],
      [SetOrigin, handleSetOrigin],
      [ValidateRemote, handleValidateRemote],
      [GetFiles, handleGetFiles],
      [GetRefs, handleGetRefs],
      [GetConfig, handleGetConfig],
    ])
    await git(Init.bareRepo())
    return git
  }
}

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
  RepoProtocol,
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

export type BareRepo = Dispatch<RepoProtocol>

export const openBareRepo = async (repoPath: string): Promise<BareRepo> => {
  const repo = new GitDirectory(repoPath)
  return messageDispatch<RepoProtocol>().withHandlers(repo, [
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
}

export const createBareRepo = async (repoPath: string): Promise<BareRepo> => {
  fs.mkdirSync(repoPath, { recursive: true })
  const git = await openBareRepo(repoPath)
  await git(Init.bareRepo())
  return git
}

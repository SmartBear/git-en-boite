import fs from 'fs'
import { commandBus } from 'git-en-boite-command-bus'
import {
  Connect,
  Fetch,
  GetRefs,
  GitRepo,
  GitRepoProtocol,
  Init,
  OpensGitRepos,
  SetOrigin,
} from 'git-en-boite-git-port'

import { GitDirectory } from './git_directory'
import { handleConnect, handleFetch, handleGetRefs, handleInit, handleSetOrigin } from './handlers'

export class GitRepoFactory implements OpensGitRepos<GitRepoProtocol> {
  open(path: string): GitRepo {
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

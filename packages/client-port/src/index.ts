import { File } from 'git-en-boite-core'

import { QueryResult } from './query_result'

export { QueryResult } from './query_result'

export interface Branch {
  name: string
  revision: string
}

export interface GitRepoInfo {
  repoId: string
  branches: Branch[]
}

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  commit: (repoId: string, branchName: string, file: File) => Promise<void>
  connectToRemote: (repoId: string, remoteUrl: string) => Promise<void>
  fetchFromRemote: (repoId: string) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
}

export interface Versioned {
  version: string
}

import { Server } from 'http'

import { QueryResult } from './query_result'
export { QueryResult } from './query_result'

export interface Branch {
  name: string
  revision: string
}

export interface ConnectRepoRequest {
  repoId: string
  remoteUrl: string
}

export interface FetchRepoRequest {
  repoId: string
}

export interface GitRepoInfo {
  repoId: string
  branches: Branch[]
}

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  connectToRemote: (request: ConnectRepoRequest) => Promise<void>
  fetchFromRemote: (request: FetchRepoRequest) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
}

export interface Versioned {
  version: string
}

export type ListensOnPort = { listen: (port: number) => Server }

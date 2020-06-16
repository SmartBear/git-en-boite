import { Ref } from 'git-en-boite-core'
import { Server } from 'http'

import { QueryResult } from './query_result'
export { QueryResult } from './query_result'

export interface Branch {
  name: string
  revision: string
  refName: string
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
  refs: Ref[]
  branches: Branch[]
}

export interface Application {
  connectToRemote: (request: ConnectRepoRequest) => Promise<void>
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
  fetchFromRemote: (request: FetchRepoRequest) => Promise<void>
  version: string
}

export interface ConnectRepoRequest {
  repoId: string
  remoteUrl: string
}

export interface FetchRepoRequest {
  repoId: string
}

export type ListensOnPort = { listen: (port: number) => Server }

import { QueryResult } from 'query_result'
import { Reference } from './reference'

export interface ConnectRepoRequest {
  repoId: string
  remoteUrl: string
}

export interface GitRepoInfo {
  repoId: string
  refs: Reference[]
}

export interface GitRepos {
  connectToRemote: (request: ConnectRepoRequest) => Promise<void>
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
}

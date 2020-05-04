import { QueryResult } from 'query_result'

export interface Reference {
  name: string
  revision: string
}

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
  refs: Reference[]
  branches: Branch[]
}

export interface GitRepo {
  refs(): Promise<Reference[]>
  path: string
}

export interface GitRepos {
  connectToRemote: (request: ConnectRepoRequest) => Promise<void>
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
  fetchFromRemote: (request: FetchRepoRequest) => Promise<void>
}

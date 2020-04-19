import { GitRepo } from './git_repo'
import { QueryResult } from 'query_result'

export interface ConnectRepoRequest {
  repoId: string
  remoteUrl: string
}

export interface GitRepos {
  connectToRemote: (request: ConnectRepoRequest) => Promise<void>
  findRepo: (repoId: string) => QueryResult<GitRepo>
}

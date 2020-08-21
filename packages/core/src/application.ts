import {
  Author,
  BranchName,
  CommitMessage,
  GitFile,
  GitRepoInfo,
  QueryResult,
  RemoteUrl,
  RepoId,
} from '.'

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  commit: (
    repoId: RepoId,
    branchName: BranchName,
    files: GitFile[],
    author: Author,
    message: CommitMessage,
  ) => Promise<void>
  connectToRemote: (repoId: RepoId, remoteUrl: RemoteUrl) => Promise<void>
  fetchFromRemote: (repoId: RepoId) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: RepoId) => Promise<QueryResult<GitRepoInfo>>
}

export interface Versioned {
  version: string
}

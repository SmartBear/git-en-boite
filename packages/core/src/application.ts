import { Author, BranchName, CommitMessage, File, GitRepoInfo, QueryResult, RepoId } from '.'
import { RemoteUrl } from './remote_url'

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  commit: (
    repoId: RepoId,
    branchName: BranchName,
    files: File[],
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

import { Author, RepoId, BranchName, QueryResult, GitRepoInfo, File } from '.'

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  commit: (repoId: RepoId, branchName: BranchName, files: File[], author: Author) => Promise<void>
  connectToRemote: (repoId: RepoId, remoteUrl: string) => Promise<void>
  fetchFromRemote: (repoId: RepoId) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: RepoId) => Promise<QueryResult<GitRepoInfo>>
}

export interface Versioned {
  version: string
}

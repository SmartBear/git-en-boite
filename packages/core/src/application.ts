import { File } from './file'
import { BranchName } from './branch_name'
import { GitRepoInfo } from './git_repo_info'
import { QueryResult } from './query_result'
import { Author } from '.'

export type Application = CommandsApplication & QueriesApplication & Versioned

export interface CommandsApplication {
  commit: (repoId: string, branchName: BranchName, files: File[], author: Author) => Promise<void>
  connectToRemote: (repoId: string, remoteUrl: string) => Promise<void>
  fetchFromRemote: (repoId: string) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: string) => Promise<QueryResult<GitRepoInfo>>
}

export interface Versioned {
  version: string
}

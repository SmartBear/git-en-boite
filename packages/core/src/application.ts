import {
  Author,
  BranchName,
  CommitMessage,
  RepoSnapshot,
  QueryResult,
  RemoteUrl,
  RepoId,
  Files,
  SubscribesToDomainEvents,
} from '.'

export type Application = CommandsApplication & QueriesApplication & ExposesDomainEvents & Versioned

export interface CommandsApplication {
  commit: (
    repoId: RepoId,
    branchName: BranchName,
    files: Files,
    author: Author,
    message: CommitMessage,
  ) => Promise<void>
  connectToRemote: (repoId: RepoId, remoteUrl: RemoteUrl) => Promise<void>
  fetchFromRemote: (repoId: RepoId) => Promise<void>
}

export interface QueriesApplication {
  getInfo: (repoId: RepoId) => Promise<QueryResult<RepoSnapshot>>
}

export interface ExposesDomainEvents {
  events: SubscribesToDomainEvents
}

export interface Versioned {
  version: string
}

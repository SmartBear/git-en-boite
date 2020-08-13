import { RefName } from './pending_commit_ref'

export interface CommitRef {
  branchName: string
  local: string
}

export interface FetchedCommitRef extends CommitRef {
  fetched: string
}

export interface PushableCommitRef extends CommitRef {
  remote: RefName
}

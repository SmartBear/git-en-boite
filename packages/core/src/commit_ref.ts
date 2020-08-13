import { RefName } from '.'

export interface CommitRef {
  branchName: string
  local: string
}

export interface FetchedCommitRef extends CommitRef {
  fetched: RefName
}

export interface PushableCommitRef extends CommitRef {
  remote: RefName
}

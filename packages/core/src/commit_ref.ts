import { RefName } from '.'

export interface CommitRef {
  branchName: string
  local: RefName
}

export interface FetchedCommitRef extends CommitRef {
  fetched: RefName
}

export interface PushableCommitRef extends CommitRef {
  remote: RefName
}

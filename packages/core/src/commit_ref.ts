import { RefName } from '.'

export interface CommitRef {
  branchName: string
  local: RefName
  parent: RefName
}

export interface PushableCommitRef extends CommitRef {
  remote: RefName
}

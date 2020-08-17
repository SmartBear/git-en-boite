import { RefName } from '.'
import { BranchName } from './branch_name'

export interface CommitRef {
  branchName: BranchName
  local: RefName
  parent: RefName
}

export interface PushableCommitRef extends CommitRef {
  remote: RefName
}

import { BranchName, CommitName } from '.'

export interface Branch {
  name: BranchName
  revision: CommitName
}

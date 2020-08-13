export interface CommitRef {
  branchName: string
  local: string
}

export interface PushableCommitRef extends CommitRef {
  remote: string
}

export interface CommitRef {
  branchName: string
  localRef: string
}

export interface PushableCommitRef extends CommitRef {
  remoteRef: string
}

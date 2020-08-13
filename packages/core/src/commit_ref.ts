export interface CommitRef {
  branchName: string
  localRefName: string
}

export interface PushableCommitRef extends CommitRef {
  remoteRef: string
}

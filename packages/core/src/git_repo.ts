import { File, Ref, CommitRef, PushableCommitRef } from '.'

export interface GitRepo {
  commit(commitRef: CommitRef, file: File): Promise<void>
  push(commitRef: PushableCommitRef): Promise<void>
  setOriginTo(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Ref[]>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }

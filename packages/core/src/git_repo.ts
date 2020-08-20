import { Author, CommitMessage, CommitRef, File, PushableCommitRef, Refs, RemoteUrl } from '.'

export interface GitRepo {
  commit(commitRef: CommitRef, files: File[], author: Author, message: CommitMessage): Promise<void>
  push(commitRef: PushableCommitRef): Promise<void>
  setOriginTo(remoteUrl: RemoteUrl): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Refs>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }

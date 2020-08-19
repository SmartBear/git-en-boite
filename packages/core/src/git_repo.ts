import { CommitRef, File, PushableCommitRef } from '.'
import { Refs } from './refs'
import { Author } from './author'

export interface GitRepo {
  commit(commitRef: CommitRef, files: File[], author: Author): Promise<void>
  push(commitRef: PushableCommitRef): Promise<void>
  setOriginTo(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Refs>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }

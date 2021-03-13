import { Author, CommitMessage, CommitRef, FileContent, FilePath, Files, PushableCommitRef, Refs, RemoteUrl } from '.'
import { CommitName } from './commit_name'

export interface LocalClone {
  commit(commitRef: CommitRef, files: Files, author: Author, message: CommitMessage): Promise<void>
  push(commitRef: PushableCommitRef): Promise<void>
  setOriginTo(remoteUrl: RemoteUrl): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Refs>
  showFile(revision: CommitName, location: FilePath): Promise<FileContent>
}

export type LocalClones = {
  openExisting: (path: string) => Promise<LocalClone>
  createNew: (path: string) => Promise<LocalClone>
  removeExisting: (path: string) => Promise<void>
  confirmExists: (path: string) => boolean
}

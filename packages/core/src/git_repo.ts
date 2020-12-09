import { Author, CommitMessage, CommitRef, Files, PushableCommitRef, Refs, RemoteUrl } from '.'

export interface LocalClone {
  commit(commitRef: CommitRef, files: Files, author: Author, message: CommitMessage): Promise<void>
  push(commitRef: PushableCommitRef): Promise<void>
  setOriginTo(remoteUrl: RemoteUrl): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Refs>
}

export type LocalClones = {
  openExisting: (path: string) => Promise<LocalClone>
  createNew: (path: string) => Promise<LocalClone>
  removeExisting: (path: string) => Promise<void>
}

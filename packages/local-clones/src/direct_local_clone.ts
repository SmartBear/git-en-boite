import fs from 'fs'
import {
  Author,
  CommitMessage,
  Files,
  LocalClone,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'

import { createBareRepo, openBareRepo } from './bare_repo'
import { Commit, Connect, Fetch, GetRefs, Push, RepoProtocol } from './operations'

export class DirectLocalClone implements LocalClone {
  static async openExisting(path: string): Promise<LocalClone> {
    if (!fs.existsSync(path)) throw new Error('Local clone does not exist')
    return new DirectLocalClone(await openBareRepo(path))
  }

  static async createNew(path: string): Promise<LocalClone> {
    if (fs.existsSync(path)) throw new Error('Local clone already exists')
    return new DirectLocalClone(await createBareRepo(path))
  }

  protected constructor(private readonly git: Dispatch<RepoProtocol>) {}

  commit(
    commitRef: PendingCommitRef,
    files: Files,
    author: Author,
    message: CommitMessage,
  ): Promise<void> {
    return this.git(
      Commit.toCommitRef(commitRef).withFiles(files).byAuthor(author).withMessage(message),
    )
  }

  async push(commitRef: PendingCommitRef): Promise<void> {
    return this.git(Push.pendingCommitFrom(commitRef))
  }

  setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    return this.git(Connect.toUrl(remoteUrl))
  }

  fetch(): Promise<void> {
    return this.git(Fetch.fromOrigin())
  }

  getRefs(): Promise<Refs> {
    return this.git(GetRefs.all())
  }

  close(): Promise<void> {
    return Promise.resolve()
  }
}

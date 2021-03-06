import fs from 'fs'
import {
  Author,
  CommitMessage,
  CommitName,
  FileContent,
  FilePath,
  Files,
  LocalClone,
  LocalClones,
  PendingCommitRef,
  Refs,
  RemoteUrl,
  UnknownValue,
} from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'

import { createBareRepo, openBareRepo } from './bare_repo'
import { Commit, Connect, Fetch, GetConfig, GetRefs, Push, RepoProtocol, ShowFile } from './operations'

export class DirectLocalClones implements LocalClones {
  async openExisting(path: string): Promise<LocalClone> {
    if (!this.confirmExists(path)) throw new Error(`Local clone does not exist at path ${path}`)
    return new DirectLocalClone(await openBareRepo(path))
  }

  async createNew(path: string): Promise<LocalClone> {
    if (this.confirmExists(path)) {
      throw new Error(`Local clone already exists at path ${path}`)
    }
    return new DirectLocalClone(await createBareRepo(path))
  }

  async removeExisting(path: string): Promise<void> {
    if (!fs.existsSync(path)) throw new Error(`Local clone does not exist at path ${path}`)
    fs.rmdirSync(path, { recursive: true })
  }

  confirmExists(path: string): boolean {
    return fs.existsSync(path)
  }
}

class DirectLocalClone implements LocalClone {
  public constructor(private readonly git: Dispatch<RepoProtocol>) {}

  commit(commitRef: PendingCommitRef, files: Files, author: Author, message: CommitMessage): Promise<void> {
    return this.git(Commit.toCommitRef(commitRef).withFiles(files).byAuthor(author).withMessage(message))
  }

  async push(commitRef: PendingCommitRef): Promise<void> {
    return this.git(Push.pendingCommitFrom(commitRef))
  }

  setOriginTo(remoteUrl: RemoteUrl): Promise<void> {
    return this.git(Connect.toUrl(remoteUrl))
  }

  async getOrigin(): Promise<RemoteUrl | UnknownValue> {
    const config = await this.git(GetConfig.forRepo())
    const origin = config['remote.origin.url']
    if (!origin) return new UnknownValue()
    return RemoteUrl.of(origin)
  }

  fetch(): Promise<void> {
    return this.git(Fetch.fromOrigin())
  }

  getRefs(): Promise<Refs> {
    return this.git(GetRefs.all())
  }

  showFile(revision: CommitName, location: FilePath): Promise<FileContent> {
    return this.git(ShowFile.for(revision).at(location))
  }

  close(): Promise<void> {
    return Promise.resolve()
  }
}

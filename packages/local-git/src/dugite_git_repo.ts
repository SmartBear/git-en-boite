import {
  Author,
  CommitMessage,
  GitFile,
  GitRepo,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'

import { Commit, Connect, Fetch, GetRefs, Push, RepoProtocol } from './operations'
import { RepoFactory } from './repo_factory'

export class DugiteGitRepo implements GitRepo {
  static async openGitRepo(path: string): Promise<GitRepo> {
    const dispatch = await new RepoFactory().open(path)
    return new DugiteGitRepo(dispatch)
  }

  protected constructor(private readonly git: Dispatch<RepoProtocol>) {}

  commit(
    commitRef: PendingCommitRef,
    files: GitFile[],
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

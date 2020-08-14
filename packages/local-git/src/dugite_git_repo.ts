import { File, GitRepo, PendingCommitRef, Refs } from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'

import { BareRepoFactory } from './bare_repo_factory'
import { BareRepoProtocol, Commit, Connect, Fetch, GetRefs, Push } from './operations'

export class DugiteGitRepo implements GitRepo {
  static async openGitRepo(path: string): Promise<GitRepo> {
    const dispatch = await new BareRepoFactory().open(path)
    return new DugiteGitRepo(dispatch)
  }

  protected constructor(private readonly git: Dispatch<BareRepoProtocol>) {}

  commit(commitRef: PendingCommitRef, file: File): Promise<void> {
    return this.git(Commit.toCommitRef(commitRef).withFiles([file]))
  }

  async push(commitRef: PendingCommitRef): Promise<void> {
    return this.git(Push.pendingCommitFrom(commitRef))
  }

  setOriginTo(remoteUrl: string): Promise<void> {
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

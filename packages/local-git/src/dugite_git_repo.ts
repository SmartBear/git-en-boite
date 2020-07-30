import { GitRepo, Ref } from 'git-en-boite-core'
import { BareRepoFactory } from './bare_repo_factory'
import { BareRepoProtocol, Connect, Fetch, GetRefs } from './operations'
import { Dispatch } from 'git-en-boite-message-dispatch'

export class DugiteGitRepo implements GitRepo {
  static async openGitRepo(path: string): Promise<GitRepo> {
    const dispatch = await new BareRepoFactory().open(path)
    return new DugiteGitRepo(dispatch)
  }

  protected constructor(private readonly git: Dispatch<BareRepoProtocol>) {}

  connect(remoteUrl: string): Promise<void> {
    return this.git(Connect.toUrl(remoteUrl))
  }

  fetch(): Promise<void> {
    return this.git(Fetch.fromOrigin())
  }

  getRefs(): Promise<Ref[]> {
    return this.git(GetRefs.all())
  }

  close(): Promise<void> {
    return Promise.resolve()
  }
}

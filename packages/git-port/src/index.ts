import { Dispatch, ValidProtocol, AsyncCommand, AsyncQuery } from 'git-en-boite-command-bus'
import { Author, Ref } from 'git-en-boite-core'

export class Checkout {
  protected constructor(public readonly branchName: string) {}

  static branch(branchName: string) {
    return new this(branchName)
  }
}

export class Commit {
  protected constructor(public readonly message: string, public readonly author: Author) {}

  static withMessage(message: string) {
    return new Commit(message, new Author('A user', 'unknown@unknown.com'))
  }

  static withAnyMessage() {
    return Commit.withMessage('A commit message')
  }

  byAuthor(author: Author) {
    return new Commit(this.message, author)
  }
}

export class EnsureBranchExists {
  protected constructor(public readonly name: string) {}

  static named(name: string) {
    return new EnsureBranchExists(name)
  }
}

export class Fetch {
  private unique: void
  static fromOrigin() {
    return new this()
  }
}

export class GetRefs {
  private unique: void

  static all() {
    return new this()
  }
}

export class GetRevision {
  protected constructor(public readonly reference: string) {}

  static forBranchNamed(reference: string) {
    return new GetRevision(reference)
  }
}

export class Init {
  protected constructor(public readonly isBare: boolean) {}

  static bareRepo() {
    return new Init(true)
  }

  static nonBareRepo() {
    return new Init(false)
  }
}

export class SetOrigin {
  protected constructor(public readonly url: string) {}

  static toUrl(url: string) {
    return new this(url)
  }
}

export class Connect {
  protected constructor(public readonly remoteUrl: string) {}

  static toUrl(remoteUrl: string) {
    return new this(remoteUrl)
  }
}

export class GetConfig {
  protected constructor(public readonly scope: 'local' | 'worktree' | 'file') {}

  static forRepo(): GetConfig {
    return new this('local')
  }
}

export interface Config {
  [key: string]: string
}

export type GitRepo = Dispatch<BareRepoProtocol>

export interface OpensGitRepos<Protocol extends ValidProtocol<Protocol>> {
  open(path: string): Promise<Dispatch<Protocol>>
}

export type BareRepoProtocol = [
  AsyncCommand<Connect>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetConfig, Config>,
]

// only used to create origin repos for testing
export type NonBareRepoProtocol = [
  AsyncCommand<Checkout>,
  AsyncCommand<Commit>,
  AsyncCommand<EnsureBranchExists>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetRevision, string>,
  AsyncQuery<GetConfig, Config>,
]

export { verifyRepoFactoryContract } from './verify_repo_factory_contract'

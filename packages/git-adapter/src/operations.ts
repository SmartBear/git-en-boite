import { Author, Ref } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery } from 'git-en-boite-message-dispatch'

export class Checkout {
  protected constructor(public readonly branchName: string) {}

  static branch(branchName: string): Checkout {
    return new this(branchName)
  }
}

export class Commit {
  protected constructor(public readonly message: string, public readonly author: Author) {}

  static withMessage(message: string): Commit {
    return new Commit(message, new Author('A user', 'unknown@unknown.com'))
  }

  static withAnyMessage(): Commit {
    return Commit.withMessage('A commit message')
  }

  byAuthor(author: Author): Commit {
    return new Commit(this.message, author)
  }
}

export class EnsureBranchExists {
  protected constructor(public readonly name: string) {}

  static named(name: string): EnsureBranchExists {
    return new EnsureBranchExists(name)
  }
}

export class Fetch {
  private unique: void

  static fromOrigin(): Fetch {
    return new this()
  }
}

export class GetRefs {
  private unique: void

  static all(): GetRefs {
    return new this()
  }
}

export class GetRevision {
  protected constructor(public readonly reference: string) {}

  static forBranchNamed(reference: string): GetRevision {
    return new GetRevision(reference)
  }
}

export class Init {
  protected constructor(public readonly isBare: boolean) {}

  static bareRepo(): Init {
    return new Init(true)
  }

  static nonBareRepo(): Init {
    return new Init(false)
  }
}

export class SetOrigin {
  protected constructor(public readonly url: string) {}

  static toUrl(url: string): SetOrigin {
    return new this(url)
  }
}

export class Connect {
  protected constructor(public readonly remoteUrl: string) {}

  static toUrl(remoteUrl: string): Connect {
    return new this(remoteUrl)
  }
}

export class GetConfig {
  protected constructor(public readonly scope: 'local' | 'worktree' | 'file') {}

  static forRepo(): GetConfig {
    return new this('local')
  }
}

export class ValidateRemote {
  protected constructor(public readonly url: string) {}

  static url(url: string): ValidateRemote {
    return new this(url)
  }
}

export interface Config {
  [key: string]: string
}

export type BareRepoProtocol = [
  AsyncCommand<Connect>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<SetOrigin>,
  AsyncCommand<ValidateRemote>,
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
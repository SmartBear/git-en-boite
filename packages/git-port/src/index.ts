import { DispatchCommands } from 'git-en-boite-command-bus'
import { Author } from 'git-en-boite-core'

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
  static fromOrigin() {
    return new this()
  }
}

export class GetRefs {
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

  static normalRepo() {
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

  static toUrl(remoteUrl: string): Connect {
    return new this(remoteUrl)
  }
}

export interface OpensGitRepos {
  open(path: string): Promise<DispatchCommands>
}

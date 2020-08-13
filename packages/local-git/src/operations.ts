import { Author, FetchedCommitRef, File, PendingCommitRef, Ref, CommitRef } from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery } from 'git-en-boite-message-dispatch'

export class Checkout {
  protected constructor(public readonly branchName: string) {}

  static branch(branchName: string): Checkout {
    return new this(branchName)
  }
}

export class Commit {
  protected constructor(
    public readonly commitRef: FetchedCommitRef | CommitRef,
    public readonly files: File[],
    public readonly message: string,
    public readonly author: Author,
  ) {}

  static toCommitRef(commitRef: FetchedCommitRef | CommitRef): Commit {
    return new Commit(
      commitRef,
      [],
      'A commit message',
      new Author('A user', 'unknown@unknown.com'),
    )
  }

  byAuthor(author: Author): Commit {
    return new Commit(this.commitRef, this.files, this.message, author)
  }

  withFiles(files: File[]): Commit {
    return new Commit(this.commitRef, files, this.message, this.author)
  }

  withMessage(message: string): Commit {
    return new Commit(this.commitRef, this.files, message, this.author)
  }
}

export class Fetch {
  private unique: void

  static fromOrigin(): Fetch {
    return new this()
  }
}

export class Push {
  private constructor(public readonly commitRef: PendingCommitRef) {}

  static pendingCommitFrom(commitRef: PendingCommitRef): Push {
    return new this(commitRef)
  }
}

export class GetFiles {
  private constructor(public readonly branchName: string) {}

  static forBranchNamed(branchName: string): GetFiles {
    return new this(branchName)
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
  AsyncCommand<Commit>,
  AsyncCommand<Connect>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<Push>,
  AsyncCommand<SetOrigin>,
  AsyncCommand<ValidateRemote>,
  AsyncQuery<GetFiles, File[]>,
  AsyncQuery<GetRefs, Ref[]>,
  AsyncQuery<GetConfig, Config>,
  AsyncQuery<GetRevision, string>,
]

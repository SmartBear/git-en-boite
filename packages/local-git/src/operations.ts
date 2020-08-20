import {
  Author,
  CommitRef,
  File,
  PendingCommitRef,
  Refs,
  BranchName,
  CommitMessage,
} from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery } from 'git-en-boite-message-dispatch'

export class Commit {
  protected constructor(
    public readonly commitRef: CommitRef,
    public readonly files: File[],
    public readonly message: CommitMessage,
    public readonly author: Author,
  ) {}

  static toCommitRef(commitRef: CommitRef): Commit {
    return new Commit(
      commitRef,
      [],
      new CommitMessage('A commit message'),
      new Author('A user', 'unknown@unknown.com'),
    )
  }

  byAuthor(author: Author): Commit {
    return new Commit(this.commitRef, this.files, this.message, author)
  }

  withFiles(files: File[]): Commit {
    return new Commit(this.commitRef, files, this.message, this.author)
  }

  withMessage(message: CommitMessage): Commit {
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
  private constructor(public readonly branchName: BranchName) {}

  static for(branchName: BranchName): GetFiles {
    return new this(branchName)
  }
}

export class GetRefs {
  private unique: void

  static all(): GetRefs {
    return new this()
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
  protected constructor(public readonly remoteUrl: RemoteUrl) {}

  static toUrl(remoteUrl: RemoteUrl): Connect {
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

export type RepoProtocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Connect>,
  AsyncCommand<Fetch>,
  AsyncCommand<Init>,
  AsyncCommand<Push>,
  AsyncCommand<SetOrigin>,
  AsyncCommand<ValidateRemote>,
  AsyncQuery<GetFiles, File[]>,
  AsyncQuery<GetRefs, Refs>,
  AsyncQuery<GetConfig, Config>,
]

import {
  Author,
  BranchName,
  CommitMessage,
  CommitRef,
  Email,
  Files,
  NameOfPerson,
  PendingCommitRef,
  Refs,
  RemoteUrl,
} from 'git-en-boite-core'
import { AsyncCommand, AsyncQuery } from 'git-en-boite-message-dispatch'

export class Commit {
  protected constructor(
    public readonly commitRef: CommitRef,
    public readonly files: Files,
    public readonly message: CommitMessage,
    public readonly author: Author,
  ) {}

  static toCommitRef(commitRef: CommitRef): Commit {
    return new Commit(
      commitRef,
      [],
      CommitMessage.of('A commit message'),
      new Author(new NameOfPerson('A user'), new Email('unknown@unknown.com')),
    )
  }

  byAuthor(author: Author): Commit {
    return new Commit(this.commitRef, this.files, this.message, author)
  }

  withFiles(files: Files): Commit {
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
  static bareRepo(): Init {
    return new Init()
  }
}

export class SetOrigin {
  protected constructor(public readonly url: RemoteUrl) {}

  static toUrl(url: RemoteUrl): SetOrigin {
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
  protected constructor(public readonly url: RemoteUrl) {}

  static url(url: RemoteUrl): ValidateRemote {
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
  AsyncQuery<GetFiles, Files>,
  AsyncQuery<GetRefs, Refs>,
  AsyncQuery<GetConfig, Config>,
]

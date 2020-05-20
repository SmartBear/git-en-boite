import { Author } from 'git-en-boite-core'

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

export class GetRevision {
  protected constructor(public readonly reference: string) {}

  static forCurrentBranch() {
    return new GetRevision('HEAD')
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

export type GitOperation = Init | Commit | Fetch | EnsureBranchExists | GetRevision | SetOrigin

export type OperateGitRepo = (operation: GitOperation) => any // until we figure out how to do better about return types

export interface OpensGitRepos {
  open(path: string): Promise<OperateGitRepo>
}

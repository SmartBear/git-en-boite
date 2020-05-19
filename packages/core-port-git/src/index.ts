export class Commit {
  protected constructor(public readonly message: string) {}

  static withMessage(message: string) {
    return new Commit(message)
  }

  static withAnyMessage() {
    return new Commit('A commit message')
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

export type GitRepo = (operation: GitOperation) => any // until we figure out how to do better about return types

export interface OpensGitRepos {
  open(path: string): Promise<GitRepo>
}

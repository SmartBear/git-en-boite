export class Commit {
  protected constructor(public readonly message: string) {}

  static withMessage(message: string) {
    return new Commit(message)
  }

  static withAnyMessage() {
    return new Commit('A commit message')
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

export class Misc {
  protected constructor(public readonly command: string, public readonly args: string[]) {}

  static command(name: string) {
    return new Misc(name, [])
  }

  withArgs(...args: string[]) {
    return new Misc(this.command, args)
  }
}

export class GetRevision {
  protected constructor(public readonly reference: string) {}

  static forCurrentBranch() {
    return new GetRevision('HEAD')
  }
}

export class EnsureBranchExists {
  protected constructor(public readonly name: string) {}

  static named(name: string) {
    return new EnsureBranchExists(name)
  }
}

export type GitCommand = Init | Commit | Misc | EnsureBranchExists | GetRevision

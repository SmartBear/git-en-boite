export class Ref {
  constructor(public readonly revision: string, public readonly refName: string) {}

  get isRemote(): boolean {
    return !!this.refName.match('^refs/remotes/')
  }

  get branchName(): string {
    return this.refName.replace('refs/remotes/origin/', '')
  }
}

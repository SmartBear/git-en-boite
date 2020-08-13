import { RefName } from '.'

export class Ref {
  constructor(public readonly revision: string, public readonly refName: RefName) {}

  get isRemote(): boolean {
    return !!this.refName.value.match('^refs/remotes/')
  }

  get branchName(): string {
    return this.refName.value.replace('refs/remotes/origin/', '')
  }
}

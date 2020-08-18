import { RefName, Branch } from '.'

export class Ref {
  constructor(public readonly revision: string, public readonly refName: RefName) {}

  get isRemote(): boolean {
    return !!this.refName.value.match('^refs/remotes/')
  }

  get branchName(): string {
    return this.refName.branchName.value
  }

  toBranch(): Branch {
    return { name: this.branchName, revision: this.revision }
  }
}

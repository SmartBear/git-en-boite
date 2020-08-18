import { RefName, Branch } from '.'
import { BranchName } from './branch_name'

export class Ref {
  constructor(public readonly revision: string, public readonly refName: RefName) {}

  get isRemote(): boolean {
    return !!this.refName.value.match('^refs/remotes/')
  }

  get branchName(): BranchName {
    return this.refName.branchName
  }

  toBranch(): Branch {
    return { name: this.branchName.value, revision: this.revision }
  }
}

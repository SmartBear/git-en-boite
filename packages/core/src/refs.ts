import { Ref } from '.'
import { BranchName } from './branch_name'

export class Refs extends Array<Ref> {
  forBranch(branchName: string): Ref {
    return this.find(ref => ref.branchName.equals(BranchName.of(branchName)))
  }
}

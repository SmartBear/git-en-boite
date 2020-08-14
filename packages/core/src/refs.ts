import { Ref } from '.'

export class Refs extends Array<Ref> {
  forBranch(branchName: string): Ref {
    return this.find(ref => ref.branchName === branchName)
  }
}

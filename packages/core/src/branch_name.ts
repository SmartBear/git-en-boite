import { TinyTypeOf } from 'tiny-types'

export class BranchName extends TinyTypeOf<string>() {
  static of(name: string): BranchName {
    return new BranchName(name)
  }
}

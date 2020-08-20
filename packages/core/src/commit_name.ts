import { TinyTypeOf } from 'tiny-types'

export class CommitName extends TinyTypeOf<string>() {
  static of(value: string): CommitName {
    return new CommitName(value)
  }
}

import { TinyTypeOf } from 'tiny-types'

export class CommitMessage extends TinyTypeOf<string>() {
  toString(): string {
    return this.value
  }
}

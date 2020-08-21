import { TinyTypeOf } from 'tiny-types'

export class CommitMessage extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static of(value: string): CommitMessage {
    return new CommitMessage(value)
  }

  toString(): string {
    return this.value
  }
}

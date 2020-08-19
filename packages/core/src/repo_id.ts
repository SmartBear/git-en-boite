import { TinyTypeOf } from 'tiny-types'

export class RepoId extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static of(value: string): RepoId {
    return new RepoId(value)
  }

  toString(): string {
    return this.value
  }
}

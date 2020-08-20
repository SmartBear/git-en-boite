import { TinyTypeOf, JSONPrimitive, ensure, isString, matches } from 'tiny-types'
import { v4 as uuid } from 'uuid'

export class RepoId extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static of(value: string): RepoId {
    return new RepoId(value)
  }

  static fromJSON(json: JSONPrimitive): RepoId {
    ensure('RepoId', json, isString())
    ensure('RepoId', json, matches(/^[a-z0-9\-\.]+$/))
    return new RepoId(json as string)
  }

  static generate(): RepoId {
    return RepoId.of(`repo-${uuid()}`)
  }

  toString(): string {
    return this.value
  }
}

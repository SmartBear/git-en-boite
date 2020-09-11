import { ensure, isString, JSONPrimitive } from 'tiny-types'
import { v4 as uuid } from 'uuid'

import { EntityId } from './entity_id'

export class RepoId extends EntityId {
  static of(value: string): RepoId {
    return new RepoId(value)
  }

  static fromJSON(json: JSONPrimitive): RepoId {
    ensure('RepoId', json, isString())
    return new RepoId(json as string)
  }

  static generate(): RepoId {
    return RepoId.of(`repo-${uuid()}`)
  }

  toString(): string {
    return this.value
  }

  urlEncode(): string {
    return encodeURIComponent(this.value)
  }
}

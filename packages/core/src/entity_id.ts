import { TinyTypeOf } from 'tiny-types'

export class EntityId extends TinyTypeOf<string>() {
  toString(): string {
    return this.value
  }
}

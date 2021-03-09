import { ensure, isString, JSONValue, TinyTypeOf } from 'tiny-types'

export class Timestamp extends TinyTypeOf<Date>() {
  static fromJSON(json: JSONValue): Timestamp {
    ensure('Timestamp', json, isString())
    return new Timestamp(new Date(Date.parse(json as string)))
  }

  static now(): Timestamp {
    return new Timestamp(new Date())
  }
}

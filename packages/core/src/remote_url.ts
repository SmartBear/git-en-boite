import { ensure, isString, JSONPrimitive, TinyTypeOf } from 'tiny-types'

export class RemoteUrl extends TinyTypeOf<string>() {
  protected constructor(value: string) {
    super(value)
  }

  static of(value: string): RemoteUrl {
    return new RemoteUrl(value)
  }

  static fromJSON(json: JSONPrimitive): RemoteUrl {
    ensure('RemoteUrl', json, isString())
    return new RemoteUrl(json as string)
  }

  toString(): string {
    return this.value
  }
}

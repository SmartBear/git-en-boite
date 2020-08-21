import { ensure, isString, JSONObject, property, TinyType } from 'tiny-types'

export class Author extends TinyType {
  static fromJSON(json: JSONObject): Author {
    ensure('Author', json, property('name', isString()))
    const name = (json as JSONObject).name as string
    ensure('Author', json, property('email', isString()))
    const email = (json as JSONObject).email as string
    return new Author(name, email)
  }

  constructor(public readonly name: string, public readonly email: string) {
    super()
  }

  toString(): string {
    return `${this.name} <${this.email}>`
  }
}

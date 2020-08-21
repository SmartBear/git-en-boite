import { ensure, isString, JSONObject, property, TinyType, TinyTypeOf } from 'tiny-types'

export class Email extends TinyTypeOf<string>() {
  toString(): string {
    return this.value
  }
}

export class NameOfPerson extends TinyTypeOf<string>() {
  toString(): string {
    return this.value
  }
}

export class Author extends TinyType {
  static fromJSON(json: JSONObject): Author {
    ensure('Author', json, property('name', isString()))
    ensure('Author', json, property('email', isString()))
    const name = (json as JSONObject).name as string
    const email = (json as JSONObject).email as string
    return new Author(new NameOfPerson(name), new Email(email))
  }

  constructor(public readonly name: NameOfPerson, public readonly email: Email) {
    super()
  }

  toString(): string {
    return `${this.name} <${this.email}>`
  }
}

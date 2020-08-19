export class Author {
  constructor(public readonly name: string, public readonly email: string) {}

  toString(): string {
    return `${this.name} <${this.email}>`
  }
}

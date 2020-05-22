export class Author {
  constructor(public readonly name: string, public readonly email: string) {}
}

export * from './ref'

export function core() {
  console.log('TODO: this is a test to see we can call code in other packages')
}

import { toUnicode } from "punycode"

class Actor {
  name: string

  constructor(name: string) {
    this.name = name
  }

  attemptsTo(action: any) {
    throw new Error('todo')
  }

  checksThat(assertion: any) {
    throw new Error('todo')
  }
}

export { Actor }

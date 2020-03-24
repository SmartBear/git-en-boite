import { toUnicode } from "punycode"

class Actor {
  abilities: object

  constructor(abilities: object) {
    this.abilities = abilities
  }

  async attemptsTo(action: any) {
    await action(this.abilities)
  }

  checksThat(assertion: any) {
    throw new Error('todo')
  }
}

export { Actor }

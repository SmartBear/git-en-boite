import { toUnicode } from "punycode"

class Actor {
  abilities: object

  constructor(abilities: object) {
    this.abilities = abilities
  }

  attemptsTo(action: any) {
    action(this.abilities)
  }

  checksThat(assertion: any) {
    throw new Error('todo')
  }
}

export { Actor }

import { toUnicode } from "punycode"

class Actor {
  name: string
  abilities: object

  constructor(name: string, abilities: object = {}) {
    this.name = name
    this.abilities = abilities
  }

  withAbilities(abilities: object) {
    return new Actor(this.name, { ...this.abilities, ...abilities })
  }

  async attemptsTo(action: any) {
    await action(this.abilities)
  }

  checksThat(assertion: any) {
    throw new Error('todo')
  }
}

export { Actor }

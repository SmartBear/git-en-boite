import { CommandBus, Doable, HandlerFunction } from './command-bus'
import { equalTo, assertThat } from 'hamjest'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    constructor(readonly songName: string) {}
  }

  class EatCake {}

  class BirthdayParty implements Doable {
    public sounds: string
    public cake: string

    commandBus: CommandBus<BirthdayParty>

    constructor(handlers: HandlerFunction<BirthdayParty>[]) {
      this.commandBus = new CommandBus<BirthdayParty>(this, handlers)
    }

    do(command: unknown): void {
      this.commandBus.do(command)
    }
  }

  const singLoudly = (sing: Sing) => (party: BirthdayParty) =>
    (party.sounds = sing.songName.toUpperCase())

  const singQuietly = (sing: Sing) => (party: BirthdayParty) =>
    (party.sounds = sing.songName.toLocaleLowerCase())

  const eatAllTheCake = () => (party: BirthdayParty) => (party.cake = 'gone')

  it('runs the same command through different handlers', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')

    const noisyHandlers: HandlerFunction<BirthdayParty>[] = [singLoudly]
    const noisyParty = new BirthdayParty(noisyHandlers)
    noisyParty.do(singHappyBirthday)
    assertThat(noisyParty.sounds, equalTo('HAPPY BIRTHDAY'))

    const quietHandlers: HandlerFunction<BirthdayParty>[] = [singQuietly]
    const quietParty = new BirthdayParty(quietHandlers)
    quietParty.do(singHappyBirthday)
    assertThat(quietParty.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()

    const handlers: HandlerFunction<BirthdayParty>[] = [singQuietly, eatAllTheCake]
    const party = new BirthdayParty(handlers)
    party.do(singHappyBirthday)
    party.do(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })
})

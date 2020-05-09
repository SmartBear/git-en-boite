import { CommandBus, Doable, HandlerFunction } from './command-bus'
import { equalTo, assertThat } from 'hamjest'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    constructor(readonly songName: string) {}
  }

  class BirthdayParty implements Doable {
    public sounds: string

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
})

import { CommandBus } from './command-bus'
import { equalTo, assertThat } from 'hamjest'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    constructor(readonly songName: string) {}
  }

  class EatCake {}

  type BirthdayCommand = Sing | EatCake

  class BirthdayParty {
    public sounds: string
    public cake: string
  }

  const singLoudly = (party: BirthdayParty, sing: Sing) =>
    (party.sounds = sing.songName.toUpperCase())

  const singQuietly = (party: BirthdayParty, sing: Sing) =>
    (party.sounds = sing.songName.toLocaleLowerCase())

  const eatAllTheCake = (party: BirthdayParty) => (party.cake = 'gone')

  it('runs the same command through different handlers', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')

    const noisyParty = new BirthdayParty()
    const noisyCommandBus = new CommandBus<BirthdayParty, BirthdayCommand>(noisyParty)
    noisyCommandBus.handle(Sing, singLoudly)
    noisyCommandBus.do(singHappyBirthday)
    assertThat(noisyParty.sounds, equalTo('HAPPY BIRTHDAY'))

    const quietParty = new BirthdayParty()
    const quietCommandBus = new CommandBus<BirthdayParty, BirthdayCommand>(quietParty)
    quietCommandBus.handle(Sing, singQuietly)
    quietCommandBus.do(singHappyBirthday)
    assertThat(quietParty.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()

    const party = new BirthdayParty()
    const commandBus = new CommandBus<BirthdayParty, BirthdayCommand>(party)
    commandBus.handle(Sing, singQuietly)
    commandBus.handle(EatCake, eatAllTheCake)
    commandBus.do(singHappyBirthday)
    commandBus.do(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })
})

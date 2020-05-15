import { CommandBus } from './command-bus'
import { equalTo, assertThat, throws, hasProperty, matchesPattern } from 'hamjest'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    protected constructor(readonly songName: string) {}
  }

  class EatCake {}

  type BirthdayCommand = Sing | EatCake

  class BirthdayParty {
    public sounds: string
    public cake: string
  }

  it('runs the same command through different handlers', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const noisyParty = new BirthdayParty()
    const quietParty = new BirthdayParty()
    const noisyCommandBus = new CommandBus<BirthdayParty, BirthdayCommand>(noisyParty)
    const quietCommandBus = new CommandBus<BirthdayParty, BirthdayCommand>(quietParty)
    noisyCommandBus.handle(Sing, (party, { songName }) => (party.sounds = songName.toUpperCase()))
    quietCommandBus.handle(
      Sing,
      (party, { songName }) => (party.sounds = songName.toLocaleLowerCase()),
    )
    noisyCommandBus.do(singHappyBirthday)
    quietCommandBus.do(singHappyBirthday)
    assertThat(noisyParty.sounds, equalTo('HAPPY BIRTHDAY'))
    assertThat(quietParty.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()

    const party = new BirthdayParty()
    const commandBus = new CommandBus<BirthdayParty, BirthdayCommand>(party)
    commandBus.handle(Sing, (party, { songName }) => (party.sounds = songName.toLocaleLowerCase()))
    commandBus.handle(EatCake, party => (party.cake = 'gone'))
    commandBus.do(singHappyBirthday)
    commandBus.do(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })

  it('returns the value returned by the handler', () => {
    const party = new BirthdayParty()
    const commandBus = new CommandBus<BirthdayParty, BirthdayCommand>(party)
    commandBus.handle(Sing, () => 'a-result')
    const result = commandBus.do(Sing.theSong('any song'))
    assertThat(result, equalTo('a-result'))
  })

  context('when there is no handler registered for a command', () => {
    it('throws an error by default', () => {
      const party = new BirthdayParty()
      const commandBus = new CommandBus<BirthdayParty, BirthdayCommand>(party)
      assertThat(
        () => commandBus.do(new EatCake()),
        throws(hasProperty('message', matchesPattern('No handler'))),
      )
    })
  })
})

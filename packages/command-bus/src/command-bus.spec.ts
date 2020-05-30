import { assertThat, equalTo } from 'hamjest'

import { CommandBus, HandleCommands, Type } from './command-bus'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    protected constructor(readonly songName: string) {}
  }

  class EatCake {}

  class Party {
    public sounds: string
    public cake: string
  }

  it('runs the same command through different handlers', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const noisyParty = new Party()
    const quietParty = new Party()
    const noisyHandlers: [Type<Sing>, HandleCommands<Party, Sing, void>][] = [
      [Sing, (party, { songName }) => (party.sounds = songName.toUpperCase())],
    ]
    const noisyCommandBus = new CommandBus<Party, Sing, [Sing, void]>(
      noisyParty,
      new Map(noisyHandlers),
    )
    const quietCommandBus = new CommandBus(quietParty).handle(
      Sing,
      (party, { songName }) => (party.sounds = songName.toLocaleLowerCase()),
    )
    noisyCommandBus.dispatch(singHappyBirthday)
    quietCommandBus.dispatch(singHappyBirthday)
    assertThat(noisyParty.sounds, equalTo('HAPPY BIRTHDAY'))
    assertThat(quietParty.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()

    const party = new Party()
    const commandBus = new CommandBus(party)
      .handle(Sing, (party, { songName }) => (party.sounds = songName.toLocaleLowerCase()))
      .handle(EatCake, party => (party.cake = 'gone'))
    commandBus.dispatch(singHappyBirthday)
    commandBus.dispatch(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })

  it('returns the value returned by the handler', () => {
    const party = new Party()
    const commandBus = new CommandBus(party).handle(Sing, () => 'a-result')
    const result = commandBus.dispatch(Sing.theSong('any song'))
    assertThat(result, equalTo('a-result'))
  })

  describe('handling composite commands', () => {
    class ThrowParty {
      constructor(public readonly songName: string) {}

      static withSong(name: string) {
        return new this(name)
      }
    }

    it('handles composite commands', () => {
      const handleSing: HandleCommands<Party, Sing> = (party, { songName }) =>
        (party.sounds = songName.toLocaleLowerCase())
      const handleEatCake: HandleCommands<Party, EatCake> = party => (party.cake = 'gone')
      const party = new Party()
      const commandBus = new CommandBus(party)
        .handle(Sing, handleSing)
        .handle(EatCake, handleEatCake)
        .handle(ThrowParty, (_, { songName }: ThrowParty, dispatch) => {
          dispatch(Sing.theSong(songName))
          dispatch(new EatCake())
        })
      commandBus.dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
      assertThat(party.cake, equalTo('gone'))
    })

    it('works when the low-level commands are asynchronous', async () => {
      const handleSingSlowly: HandleCommands<Party, Sing> = async (party, { songName }) =>
        new Promise(resolve =>
          setTimeout(() => {
            party.sounds = songName.toLocaleLowerCase()
            resolve()
          }, 0),
        )
      const handleEatCakeSlowly: HandleCommands<Party, EatCake, Promise<void>> = party =>
        new Promise(resolve =>
          setTimeout(() => {
            party.cake = 'gone'
            resolve()
          }, 0),
        )
      const handleThrowParty: HandleCommands<Party, ThrowParty> = async (
        _,
        { songName }: ThrowParty,
        dispatch,
      ) => {
        await dispatch(Sing.theSong(songName))
        await dispatch(new EatCake())
      }
      const party = new Party()
      const commandBus = new CommandBus(party)
        .handle(Sing, handleSingSlowly)
        .handle(EatCake, handleEatCakeSlowly)
        .handle(ThrowParty, handleThrowParty)
      await commandBus.dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
    })
  })
})

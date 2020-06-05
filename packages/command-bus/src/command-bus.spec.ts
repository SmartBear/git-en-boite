import { assertThat, equalTo, instanceOf } from 'hamjest'

import { commandBus, Handle } from './command-bus'

describe('CommandBus', () => {
  class Sing {
    static theSong(name: string) {
      return new Sing(name)
    }

    protected constructor(readonly songName: string) {}
  }

  class EatCake {
    private unique: void
  }

  class GetGift {
    private unique: void
  }

  class Party {
    public sounds: string
    public cake: string
  }

  it('runs the same command through different handlers', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const mattsBirthday = new Party()
    const bobsBirthday = new Party()
    const noisyParty = commandBus<[[Sing, void]]>().withHandlers(mattsBirthday, [
      [Sing, (party, { songName }) => (party.sounds = songName.toUpperCase())],
    ])
    const quietParty = commandBus<[[Sing, void]]>().withHandlers(bobsBirthday, [
      [Sing, (party, { songName }) => (party.sounds = songName.toLowerCase())],
    ])
    noisyParty(singHappyBirthday)
    quietParty(singHappyBirthday)
    assertThat(mattsBirthday.sounds, equalTo('HAPPY BIRTHDAY'))
    assertThat(bobsBirthday.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()
    const party = new Party()
    const dispatch = commandBus<[[Sing, void], [EatCake, void]]>().withHandlers(party, [
      [Sing, (party, { songName }) => (party.sounds = songName.toLocaleLowerCase())],
      [EatCake, party => (party.cake = 'gone')],
    ])
    dispatch(singHappyBirthday)
    dispatch(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })

  it('returns the value returned by the handler', () => {
    class Gift {
      constructor(public readonly name: string) {}
    }
    const pony = new Gift('pony')
    const party = new Party()
    const dispatch = commandBus<[[GetGift, Gift], [EatCake, void]]>().withHandlers(party, [
      [GetGift, () => pony],
      [EatCake, party => (party.cake = 'gone')],
    ])
    const result = dispatch(new GetGift())
    assertThat(result, instanceOf(Gift))
    assertThat(result, equalTo(pony))
  })

  describe('handling composite commands', () => {
    class ThrowParty {
      constructor(public readonly songName: string) {}

      static withSong(name: string) {
        return new this(name)
      }
    }

    it('handles composite commands', () => {
      type Protocol = [[Sing, void], [EatCake, void], [ThrowParty, void]]
      const handleSing: Handle<Party, Sing, Protocol> = (party, { songName }) =>
        (party.sounds = songName.toLocaleLowerCase())
      const handleEatCake: Handle<Party, EatCake, Protocol> = party => (party.cake = 'gone')
      const handleThrowParty: Handle<Party, ThrowParty, Protocol> = (
        _,
        { songName }: ThrowParty,
        dispatch,
      ) => {
        dispatch(Sing.theSong(songName))
        dispatch(new EatCake())
      }
      const party = new Party()
      const dispatch = commandBus<Protocol>().withHandlers(party, [
        [Sing, handleSing],
        [EatCake, handleEatCake],
        [ThrowParty, handleThrowParty],
      ])
      dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
      assertThat(party.cake, equalTo('gone'))
    })

    it('works when the low-level commands are asynchronous', async () => {
      type Protocol = [[Sing, Promise<void>], [EatCake, Promise<void>], [ThrowParty, Promise<void>]]
      const handleSingSlowly: Handle<Party, Sing, Protocol> = async (party, { songName }) =>
        new Promise(resolve =>
          setTimeout(() => {
            party.sounds = songName.toLocaleLowerCase()
            resolve()
          }, 0),
        )
      const handleEatCakeSlowly: Handle<Party, EatCake, Protocol> = party =>
        new Promise(resolve =>
          setTimeout(() => {
            party.cake = 'gone'
            resolve()
          }, 0),
        )
      const handleThrowParty: Handle<Party, ThrowParty, Protocol> = async (
        _,
        { songName }: ThrowParty,
        dispatch,
      ) => {
        await dispatch(Sing.theSong(songName))
        await dispatch(new EatCake())
      }
      const party = new Party()
      const dispatch = commandBus<Protocol>().withHandlers(party, [
        [Sing, handleSingSlowly],
        [EatCake, handleEatCakeSlowly],
        [ThrowParty, handleThrowParty],
      ])
      await dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
    })
  })
})

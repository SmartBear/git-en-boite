import { assertThat, equalTo, instanceOf } from 'hamjest'

import { messageDispatch, Handle, Command, AsyncCommand, Query } from '.'

describe('dispatch', () => {
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
    type Protocol = [Command<Sing>]
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const mattsBirthday = new Party()
    const bobsBirthday = new Party()
    const noisyParty = messageDispatch<Protocol>().withHandlers(mattsBirthday, [
      [Sing, (party, { songName }) => (party.sounds = songName.toUpperCase())],
    ])
    const quietParty = messageDispatch<Protocol>().withHandlers(bobsBirthday, [
      [Sing, (party, { songName }) => (party.sounds = songName.toLowerCase())],
    ])
    noisyParty(singHappyBirthday)
    quietParty(singHappyBirthday)
    assertThat(mattsBirthday.sounds, equalTo('HAPPY BIRTHDAY'))
    assertThat(bobsBirthday.sounds, equalTo('happy birthday'))
  })

  it('finds the right handler for a given command', () => {
    type Protocol = [Command<Sing>, Command<EatCake>]
    const singHappyBirthday = Sing.theSong('Happy birthday')
    const eatCake = new EatCake()
    const party = new Party()
    const dispatch = messageDispatch<Protocol>().withHandlers(party, [
      [Sing, (party, { songName }) => (party.sounds = songName.toLocaleLowerCase())],
      [EatCake, party => (party.cake = 'gone')],
    ])
    dispatch(singHappyBirthday)
    dispatch(eatCake)
    assertThat(party.sounds, equalTo('happy birthday'))
    assertThat(party.cake, equalTo('gone'))
  })

  it('returns the value returned by the handler', () => {
    type Protocol = [Query<GetGift, Gift>, Command<EatCake>]
    class Gift {
      constructor(public readonly name: string) {}
    }
    const pony = new Gift('pony')
    const party = new Party()
    const dispatch = messageDispatch<Protocol>().withHandlers(party, [
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
      type Protocol = [Command<Sing>, Command<EatCake>, Command<ThrowParty>]
      const handleSing: Handle<Party, Command<Sing>> = (party, { songName }) =>
        (party.sounds = songName.toLocaleLowerCase())
      const handleEatCake: Handle<Party, Command<EatCake>> = party => (party.cake = 'gone')
      const handleThrowParty: Handle<Party, Command<ThrowParty>> = (
        _,
        { songName }: ThrowParty,
        dispatch,
      ) => {
        dispatch(Sing.theSong(songName))
        dispatch(new EatCake())
      }
      const party = new Party()
      const dispatch = messageDispatch<Protocol>().withHandlers(party, [
        [Sing, handleSing],
        [EatCake, handleEatCake],
        [ThrowParty, handleThrowParty],
      ])
      dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
      assertThat(party.cake, equalTo('gone'))
    })

    it('works when the low-level commands are asynchronous', async () => {
      type Protocol = [AsyncCommand<Sing>, AsyncCommand<EatCake>, AsyncCommand<ThrowParty>]
      const handleSingSlowly: Handle<Party, AsyncCommand<Sing>> = async (party, { songName }) =>
        new Promise(resolve =>
          setTimeout(() => {
            party.sounds = songName.toLocaleLowerCase()
            resolve()
          }, 0),
        )
      const handleEatCakeSlowly: Handle<Party, AsyncCommand<EatCake>> = party =>
        new Promise(resolve =>
          setTimeout(() => {
            party.cake = 'gone'
            resolve()
          }, 0),
        )
      const handleThrowParty: Handle<Party, AsyncCommand<ThrowParty>> = async (
        _,
        { songName }: ThrowParty,
        dispatch,
      ) => {
        await dispatch(Sing.theSong(songName))
        await dispatch(new EatCake())
      }
      const party = new Party()
      const dispatch = messageDispatch<Protocol>().withHandlers(party, [
        [Sing, handleSingSlowly],
        [EatCake, handleEatCakeSlowly],
        [ThrowParty, handleThrowParty],
      ])
      await dispatch(ThrowParty.withSong('Happy birthday'))
      assertThat(party.sounds, equalTo('happy birthday'))
    })
  })
})

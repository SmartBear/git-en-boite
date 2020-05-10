"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_bus_1 = require("./command-bus");
const hamjest_1 = require("hamjest");
describe('CommandBus', () => {
    class Sing {
        constructor(songName) {
            this.songName = songName;
        }
        static theSong(name) {
            return new Sing(name);
        }
    }
    class EatCake {
    }
    class BirthdayParty {
    }
    const singLoudly = (sing) => (party) => (party.sounds = sing.songName.toUpperCase());
    const singQuietly = (sing) => (party) => (party.sounds = sing.songName.toLocaleLowerCase());
    const eatAllTheCake = () => (party) => (party.cake = 'gone');
    it('runs the same command through different handlers', () => {
        const singHappyBirthday = Sing.theSong('Happy birthday');
        const noisyParty = new BirthdayParty();
        const noisyCommandBus = new command_bus_1.CommandBus(noisyParty);
        noisyCommandBus.handle(Sing, singLoudly);
        noisyCommandBus.do(singHappyBirthday);
        hamjest_1.assertThat(noisyParty.sounds, hamjest_1.equalTo('HAPPY BIRTHDAY'));
        const quietParty = new BirthdayParty();
        const quietCommandBus = new command_bus_1.CommandBus(quietParty);
        quietCommandBus.handle(Sing, singQuietly);
        quietCommandBus.do(singHappyBirthday);
        hamjest_1.assertThat(quietParty.sounds, hamjest_1.equalTo('happy birthday'));
    });
    it('finds the right handler for a given command', () => {
        const singHappyBirthday = Sing.theSong('Happy birthday');
        const eatCake = new EatCake();
        const party = new BirthdayParty();
        const commandBus = new command_bus_1.CommandBus(party);
        commandBus.handle(Sing, singQuietly);
        commandBus.handle(EatCake, eatAllTheCake);
        commandBus.do(singHappyBirthday);
        commandBus.do(eatCake);
        hamjest_1.assertThat(party.sounds, hamjest_1.equalTo('happy birthday'));
        hamjest_1.assertThat(party.cake, hamjest_1.equalTo('gone'));
    });
});

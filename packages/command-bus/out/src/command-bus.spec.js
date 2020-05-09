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
    class BirthdayParty {
        constructor(handlers) {
            this.commandBus = new command_bus_1.CommandBus(this, handlers);
        }
        do(command) {
            this.commandBus.do(command);
        }
    }
    const singLoudly = (sing) => (party) => (party.sounds = sing.songName.toUpperCase());
    const singQuietly = (sing) => (party) => (party.sounds = sing.songName.toLocaleLowerCase());
    it('runs the same command through different handlers', () => {
        const singHappyBirthday = Sing.theSong('Happy birthday');
        const noisyHandlers = [singLoudly];
        const noisyParty = new BirthdayParty(noisyHandlers);
        noisyParty.do(singHappyBirthday);
        hamjest_1.assertThat(noisyParty.sounds, hamjest_1.equalTo('HAPPY BIRTHDAY'));
        const quietHandlers = [singQuietly];
        const quietParty = new BirthdayParty(quietHandlers);
        quietParty.do(singHappyBirthday);
        hamjest_1.assertThat(quietParty.sounds, hamjest_1.equalTo('happy birthday'));
    });
});

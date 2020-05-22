"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ref_1 = require("./ref");
const hamjest_1 = require("hamjest");
describe(ref_1.Ref.name, () => {
    describe('#isRemote', () => {
        context('for a remote branch', () => {
            let ref;
            beforeEach(() => {
                ref = new ref_1.Ref('abcde1', 'refs/remotes/origin/master');
            });
            it('is true', () => {
                hamjest_1.assertThat(ref.isRemote, hamjest_1.truthy());
            });
        });
    });
    describe('#branchName', () => {
        context('for a remote branch', () => {
            let ref;
            beforeEach(() => {
                ref = new ref_1.Ref('abcde1', 'refs/remotes/origin/master');
            });
            it('returns the name of the branch', () => {
                hamjest_1.assertThat(ref.branchName, hamjest_1.equalTo('master'));
            });
        });
    });
});

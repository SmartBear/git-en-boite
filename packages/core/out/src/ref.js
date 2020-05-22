"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ref = void 0;
class Ref {
    constructor(revision, refName) {
        this.revision = revision;
        this.refName = refName;
    }
    get isRemote() {
        return !!this.refName.match('^refs/remotes/');
    }
    get branchName() {
        return this.refName.replace('refs/remotes/origin/', '');
    }
}
exports.Ref = Ref;

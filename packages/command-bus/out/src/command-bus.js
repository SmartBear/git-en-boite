"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandBus {
    constructor(target, handlers) {
        this.target = target;
        this.handlers = handlers;
    }
    do(command) {
        // TODO: Create a handler that can recognise it's command
        // TODO: test drive this with a second command / handler
        this.handlers[0](command)(this.target);
    }
}
exports.CommandBus = CommandBus;

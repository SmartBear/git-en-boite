"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Handlers {
    constructor() {
        this.handlers = new Map();
    }
    add(commandType, handler) {
        this.handlers.set(commandType, handler);
    }
    forCommand(command) {
        return this.handlers.get(command.constructor);
    }
}
exports.Handlers = Handlers;
class CommandBus {
    constructor(target, handlers) {
        this.target = target;
        this.handlers = handlers;
    }
    do(command) {
        const handler = this.handlers.forCommand(command);
        handler(command)(this.target);
    }
}
exports.CommandBus = CommandBus;

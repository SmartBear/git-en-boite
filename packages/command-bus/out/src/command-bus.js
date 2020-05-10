"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandBus {
    constructor(target) {
        this.target = target;
        this.handlers = new Map();
    }
    handle(commandType, handler) {
        this.handlers.set(commandType, handler);
    }
    do(command) {
        const handler = this.handlers.get(command.constructor);
        handler(this.target, command);
    }
}
exports.CommandBus = CommandBus;

type Type<T> = { new (...args: any[]): T }

export class CommandBus<Context, Command> {
  private handlers = new Map<Function, Handler<Context>>()

  constructor(readonly target: Context) {}

  handle(commandType: Type<Command>, handler: Handler<Context>) {
    this.handlers.set(commandType, handler)
  }

  do(command: Command) {
    const handler = this.handlers.get(command.constructor)
    handler(this.target, command)
  }
}

export interface Handler<Context> {
  (target: Context, command: any): unknown
}

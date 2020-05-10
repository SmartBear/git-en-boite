type Type<T> = { new (...args: any[]): T }

export class CommandBus<Context, Command> {
  private handlers = new Map<Function, Handler<Context>>()

  constructor(readonly target: Context) {}

  handle(commandType: Type<Command>, handler: Handler<Context>) {
    this.handlers.set(commandType, handler)
  }

  do(command: Command) {
    const handler = this.handlers.get(command.constructor)
    handler(command)(this.target)
  }
}

export interface Interaction<Context> {
  (context: Context): unknown
}

export interface Handler<Context> {
  (command: any): Interaction<Context>
}

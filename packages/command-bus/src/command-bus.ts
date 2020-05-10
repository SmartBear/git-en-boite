type Command = Record<string, any>
type Class = { new (...args: any[]): any }

export class Handlers<Context> {
  public handlers = new Map<Class, Handler<Context>>()

  add(commandType: Class, handler: Handler<Context>): void {
    this.handlers.set(commandType, handler)
  }

  forCommand(command: any): Handler<Context> {
    return this.handlers.get(command.constructor)
  }
}

export class CommandBus<Context> {
  constructor(readonly target: Context, readonly handlers: Handlers<Context>) {}

  do(command: Command) {
    const handler = this.handlers.forCommand(command)
    handler(command)(this.target)
  }
}

export interface Interaction<Context> {
  (context: Context): unknown
}

export interface Handler<Context> {
  (command: any): Interaction<Context>
}

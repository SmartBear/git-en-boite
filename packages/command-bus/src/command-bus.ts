type Type<T> = Function & { prototype: T }

export class CommandBus<Context, Command> {
  private handlers = new Map<Function, Function>()

  constructor(readonly target: Context) {}

  handle<HandledCommand extends Command>(
    commandType: Type<HandledCommand>,
    handler: Handler<Context, HandledCommand>,
  ) {
    this.handlers.set(commandType, handler)
  }

  do(command: Command) {
    const handler = this.handlers.get(command.constructor)
    return handler(this.target, command)
  }
}

export interface Handler<Context, HandledCommand> {
  (target: Context, command: HandledCommand): unknown
}

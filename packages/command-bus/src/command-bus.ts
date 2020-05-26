type Type<T> = Function & { prototype: T }

export class CommandBus<Context, Command> {
  private handlers = new Map<Function, Function>()
  private defaultHandler: Handler<Context, Command> = (_, command) => {
    throw new Error(`No handler registered for commands of type ${command.constructor.name}`)
  }

  constructor(readonly target: Context) {}

  handle<HandledCommand extends Command, Result>(
    commandType: Type<HandledCommand>,
    handler: Handler<Context, HandledCommand, Result>,
  ) {
    this.handlers.set(commandType, handler)
    return this
  }

  do<Result>(command: Command): Result {
    const handler = this.handlers.get(command.constructor) || this.defaultHandler
    return handler(this.target, command, this.do.bind(this))
  }
}

export interface Handler<Context, HandledCommand, Result = void> {
  (target: Context, command: HandledCommand): Result
}

/* eslint-disable @typescript-eslint/ban-types */
type Type<T> = Function & { prototype: T }

export class CommandBus<Context, Command> {
  private handlers = new Map<Function, Function>()
  private defaultHandler: HandlesCommands<Context, Command> = (_, command) => {
    throw new Error(`No handler registered for commands of type ${command.constructor.name}`)
  }

  constructor(readonly target: Context) {}

  handle<HandledCommand extends Command, Result>(
    commandType: Type<HandledCommand>,
    handler: HandlesCommands<Context, HandledCommand, Result>,
  ): CommandBus<Context, Command> {
    this.handlers.set(commandType, handler)
    return this
  }

  do<Result>(command: Command): Result {
    const handler = this.handlers.get(command.constructor) || this.defaultHandler
    const result = handler(this.target, command, this.do.bind(this))
    // console.log(command, ' => ', result)
    return result
  }
}

export type DispatchesCommands = <Result, Command>(command: Command) => Result

export type HandlesCommands<Context, HandledCommand, Result = void> = (
  target: Context,
  command: HandledCommand,
  dispatch?: DispatchesCommands,
) => Result

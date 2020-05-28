/* eslint-disable @typescript-eslint/ban-types */
type Type<T> = Function & { prototype: T }

export class CommandBus<Context, Command> implements DispatchesCommands {
  private defaultHandler: HandleCommands<Context, Command> = (_, command) => {
    throw new Error(`No handler registered for commands of type ${command.constructor.name}`)
  }

  constructor(readonly target: Context, readonly handlers: Map<Function, Function> = new Map()) {}

  handle<HandledCommand extends Command, Result>(
    commandType: Type<HandledCommand>,
    handler: HandleCommands<Context, HandledCommand, Result>,
  ): CommandBus<Context, Command> {
    this.handlers.set(commandType, handler)
    return new CommandBus(this.target, this.handlers)
  }

  dispatch<Result, Command>(command: Command): Result {
    const handler = this.handlers.get(command.constructor) || this.defaultHandler
    const result = handler(this.target, command, this.dispatch.bind(this))
    return result
  }
}

export interface DispatchesCommands {
  dispatch: DispatchCommands
}

export type DispatchCommands = <Result, Command>(command: Command) => Result

export type HandleCommands<Context, HandledCommand, Result = void> = (
  target: Context,
  command: HandledCommand,
  dispatch?: DispatchCommands,
) => Result

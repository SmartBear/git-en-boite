/* eslint-disable @typescript-eslint/ban-types */
type Type<T> = Function & { prototype: T }

export class CommandBus<
  Context,
  Command extends { constructor: Function },
  CommandResults extends [Command, unknown] = never
> {
  private defaultHandler: HandleCommands<Context, Command> = (_, command) => {
    throw new Error(`No handler registered for commands of type ${command.constructor.name}`)
  }

  constructor(readonly context: Context, readonly handlers: Map<Function, Function> = new Map()) {}

  handle<HandledCommand extends Command, Result>(
    commandType: Type<HandledCommand>,
    handler: HandleCommands<Context, HandledCommand, Result>,
  ): CommandBus<Context, Command, CommandResults | [HandledCommand, Result]> {
    this.handlers.set(commandType, handler)
    return new CommandBus(this.context, this.handlers)
  }

  dispatch<Command extends CommandResults[0]>(
    command: Command,
  ): Extract<CommandResults, [Command, any]>[1] {
    const handler = this.handlers.get(command.constructor) || this.defaultHandler
    const result = handler(this.context, command, this.dispatch.bind(this))
    return result
  }
}

export type DispatchCommands = <Result, Command>(command: Command) => Result

export type HandleCommands<Context, HandledCommand, Result = void> = (
  target: Context,
  command: HandledCommand,
  dispatch?: DispatchCommands,
) => Result

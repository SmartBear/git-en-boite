import { Context } from 'mocha'

/* eslint-disable @typescript-eslint/ban-types */
export type Type<T> = Function & { prototype: T }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result<Commands, Command> = Extract<Commands, [Command, any]>[1]

export class CommandBus<
  Context,
  Message extends { constructor: Function },
  Commands extends [Message, unknown] = never
> {
  constructor(readonly context: Context, readonly actions: Map<Function, Function> = new Map()) {}

  handle<HandledCommand extends Message, Result>(
    commandType: Type<HandledCommand>,
    handler: Action<Context, HandledCommand, Result>,
  ): CommandBus<Context, Message, Commands | [HandledCommand, Result]> {
    this.actions.set(commandType, handler)
    return new CommandBus(this.context, this.actions)
  }

  dispatch<Message extends Commands[0]>(nessage: Message): Result<Commands, Message> {
    const action = this.actions.get(nessage.constructor)
    return action(this.context, nessage, this.dispatch.bind(this))
  }
}

export type DispatchCommands = <Result, Command>(command: Command) => Result

export type Action<Context, Message, Result = void> = (
  context: Context,
  command: Message,
  dispatch?: DispatchCommands,
) => Result

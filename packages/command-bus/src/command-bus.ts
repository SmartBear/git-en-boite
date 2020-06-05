/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/ban-types */
export type Type<T> = Function & { prototype: T }

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

type ValidProtocol<P> = { [K in keyof P]: [unknown, unknown] } & [unknown, unknown][]

type Result<Message, Protocol extends ValidProtocol<Protocol>> = Extract<
  Protocol[number],
  [Message, unknown]
>[1]

export type Handle<Context, Message, Protocol extends ValidProtocol<Protocol>> = (
  context: Context,
  message: Message,
  dispatch?: Dispatch<Protocol>,
) => Result<Message, Protocol>

type Handlers<C, T extends ValidProtocol<T>> = {
  [K in keyof T]: [Type<T[K][0]>, Handle<C, T[K][0], T>]
}

type ValidMessage<Protocol extends ValidProtocol<Protocol>> = Protocol[number][0]

export type Dispatch<Protocol extends ValidProtocol<Protocol>> = <
  Message extends ValidMessage<Protocol>
>(
  message: Message,
) => Result<Message, Protocol>

export const commandBus = <Protocol extends ValidProtocol<Protocol>>() => ({
  withHandlers: <Context>(
    context: Context,
    handlers: Handlers<Context, Protocol>,
  ): Dispatch<Protocol> => {
    const actions = new Map<
      ValidMessage<Protocol>,
      Handle<Context, ValidMessage<Protocol>, Protocol>
    >()

    // TODO: work out how to make handlers iterable
    for (let i = 0; i < Number(handlers.length); i++) {
      const handler = handlers[i]
      actions.set(handler[0], handler[1])
    }

    const dispatch: Dispatch<Protocol> = message =>
      actions.get(message.constructor)(context, message, dispatch)
    return dispatch
  },
})

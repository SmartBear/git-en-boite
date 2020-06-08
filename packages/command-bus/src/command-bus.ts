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

export type ValidProtocol<P> = { [K in keyof P]: [unknown, unknown] } & [unknown, unknown][]

export type Result<Message, Protocol extends ValidProtocol<Protocol>> = Extract<
  Protocol[number],
  [Message, unknown]
>[1]

export type Handle<Context, Command extends [unknown, unknown]> = <
  Protocol extends ValidProtocol<Protocol>
>(
  context: Context,
  message: Command[0],
  dispatch?: Dispatch<Protocol>,
) => Command[1]

export type AsyncCommand<Message> = AsyncQuery<Message, void>
export type AsyncQuery<Message, Result> = Query<Message, Promise<Result>>
export type Command<Message> = Query<Message, void>
export type Query<Message, Result> = [Message, Result]

type HandlerSet<C, T extends ValidProtocol<T>> = {
  [K in keyof T]: [Type<T[K][0]>, Handle<C, T[K]>]
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
    handlerSet: HandlerSet<Context, Protocol>,
  ): Dispatch<Protocol> => {
    const handlers = new Map<ValidMessage<Protocol>, Handle<Context, any>>() // TODO: make a ValidHandler union type

    // TODO: work out how to make handlers iterable
    for (let i = 0; i < Number(handlerSet.length); i++) {
      const handler = handlerSet[i]
      handlers.set(handler[0], handler[1])
    }

    const dispatch: Dispatch<Protocol> = message =>
      handlers.get(message.constructor)(context, message, dispatch)
    return dispatch
  },
})

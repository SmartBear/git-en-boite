export type Dispatch<Protocol extends ValidProtocol<Protocol>> = <
  Message extends ValidMessage<Protocol>
>(
  message: Message,
) => Result<Message, Protocol>

export type ValidProtocol<P> = { [K in keyof P]: [unknown, unknown] } & [unknown, unknown][]

export type AsyncCommand<Message> = AsyncQuery<Message, void>
export type AsyncQuery<Message, Result> = Query<Message, Promise<Result>>
export type Command<Message> = Query<Message, void>
export type Query<Message, Result> = [Message, Result]

export type Handle<Context, Command extends [unknown, unknown]> = <
  Protocol extends ValidProtocol<Protocol>
>(
  context: Context,
  message: Command[0],
  dispatch?: Dispatch<Protocol>,
) => Command[1]

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function messageDispatch<Protocol extends ValidProtocol<Protocol>>() {
  return {
    withHandlers: <Context>(
      context: Context,
      handlerDefinitions: HandlerDefinitions<Context, Protocol>,
    ): Dispatch<Protocol> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlers = new Map<ValidMessage<Protocol>, Handle<Context, any>>() // TODO: make a ValidHandler union type

      // TODO: work out how to make handlers iterable
      for (let i = 0; i < Number(handlerDefinitions.length); i++) {
        const handler = handlerDefinitions[i]
        handlers.set(handler[0], handler[1])
      }

      const dispatch: Dispatch<Protocol> = message => {
        // console.log(message)
        return handlers.get(message.constructor)(context, message, dispatch)
      }
      return dispatch
    },
  }
}

export type Result<Message, Protocol extends ValidProtocol<Protocol>> = Extract<
  Protocol[number],
  [Message, unknown]
>[1]

type HandlerDefinitions<C, T extends ValidProtocol<T>> = {
  [K in keyof T]: [Type<T[K][0]>, Handle<C, T[K]>]
}
// eslint-disable-next-line @typescript-eslint/ban-types
type Type<T> = Function & { prototype: T }

type ValidMessage<Protocol extends ValidProtocol<Protocol>> = Protocol[number][0]

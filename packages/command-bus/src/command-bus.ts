export interface Doable {
  do(command: unknown): void
}

export class CommandBus<Context> {
  do(command: unknown) {
    // TODO: Create a handler that can recognise it's command
    // TODO: test drive this with a second command / handler
    this.handlers[0](command)(this.target)
  }

  constructor(readonly target: Context, readonly handlers: HandlerFunction<Context>[]) {}
}

export interface Interaction<Context> {
  (context: Context): unknown
}

export interface HandlerFunction<Context> {
  (command: any): Interaction<Context>
}

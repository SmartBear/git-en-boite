/* eslint-disable @typescript-eslint/no-explicit-any */
export type Logger = {
  debug: Logs
  info: Logs
  warn: Logs
  error: Logs
}

type Logs = (...data: any[]) => void

const noop = () => {
  /* noop */
}

class NullLogger implements Logger {
  debug = noop
  warn = noop
  info = noop
  error = noop
}

export const Logger = {
  none: new NullLogger(),
}

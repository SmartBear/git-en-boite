/* eslint-disable @typescript-eslint/no-explicit-any */
export type Logger = {
  log: (...data: any[]) => void
  error: (...data: any[]) => void
}

class NullLogger implements Logger {
  log: (...data: any[]) => void = () => {
    // no-op
  }
  error: (...data: any[]) => void = () => {
    // no-op
  }
}

export const Logger = {
  none: new NullLogger(),
}

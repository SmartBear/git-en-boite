import * as pino from 'pino'
import { LoggerOptions } from './LoggerOptions'
export * from './logToPino'
export * from './makeHttpLoggingMiddleware'

// TODO: can we merge this with the logToPino function?
export function setUpLogger(config: pino.Bindings, { readableBy }: LoggerOptions): pino.Logger {
  const logger = readableBy === 'humans' ? pino({ prettyPrint: { colorize: true } }) : pino()
  return logger.child(config)
}

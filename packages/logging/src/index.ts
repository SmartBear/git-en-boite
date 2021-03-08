import { WriteLogEvent } from 'git-en-boite-core'
import * as pino from 'pino'
import { LoggerOptions } from './LoggerOptions'
import { logToPino } from './logToPino'
export * from './logToPino'
export * from './makeHttpLoggingMiddleware'
export * from './LoggerOptions'

export function setUpLogger(config: pino.Bindings, { readableBy }: LoggerOptions): WriteLogEvent {
  const logger =
    {
      humans: pino({ prettyPrint: { colorize: true } }),
      nobody: pino({ level: 'silent' }),
    }[readableBy] || pino()
  return logToPino(logger.child(config))
}

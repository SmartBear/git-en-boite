import { WriteLogEvent } from 'git-en-boite-core'
import * as pino from 'pino'
import { LoggingOptions } from './LoggingOptions'
import { logToPino } from './logToPino'
export * from './logToPino'
export * from './makeHttpLoggingMiddleware'
export * from './LoggingOptions'

export function setUpLogger(config: pino.Bindings, { readableBy }: LoggingOptions): WriteLogEvent {
  const logger =
    {
      humans: pino({ prettyPrint: { colorize: true } }),
      nobody: pino({ level: 'silent' }),
    }[readableBy] || pino()
  return logToPino(logger.child(config))
}

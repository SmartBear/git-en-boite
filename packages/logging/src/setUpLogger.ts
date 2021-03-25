import { LogEvent, WriteLogEvent } from 'git-en-boite-core'
import * as pino from 'pino'

import { LoggingOptions } from './LoggingOptions'

export function setUpLogger(config: pino.Bindings, { readableBy }: LoggingOptions): WriteLogEvent {
  const options: pino.LoggerOptions = {
    nobody: { level: 'silent' },
    humans: { prettyPrint: { colorize: true } },
    machines: {
      formatters: {
        level(level) {
          return { level }
        },
      },
    },
  }[readableBy]
  const redactOptions: pino.LoggerOptions = {
    redact: { paths: ['job.data.remoteUrl'] },
  }
  return logToPino(pino(Object.assign(config, options, redactOptions)))
}

const isLogEvent = (event: LogEvent | Error): event is LogEvent => !!(event as LogEvent).level

export const logToPino = (mainLogger: pino.Logger): WriteLogEvent => {
  const thePinoLogger = mainLogger.child({
    messageKey: 'message',
    serializers: { req: pino.stdSerializers.req, res: pino.stdSerializers.res, err: pino.stdSerializers.err },
  })
  return (event: LogEvent | Error) => {
    if (isLogEvent(event)) thePinoLogger[event.level](event)
    else thePinoLogger.warn(event)
  }
}

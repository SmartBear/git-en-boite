import * as pino from 'pino'
import { LogEvent, WriteLogEvent } from 'git-en-boite-core'

const isLogEvent = (event: LogEvent | Error ): event is LogEvent => !!(event as LogEvent).level

export const logToPino = (mainLogger: pino.Logger): WriteLogEvent => {
  const thePinoLogger = mainLogger.child({
    messageKey: 'message',
    serializers: { req: pino.stdSerializers.req, res: pino.stdSerializers.res },
  })
  return (event: LogEvent | Error) => {
    if (isLogEvent(event)) thePinoLogger[event.level](event)
    else thePinoLogger.warn(event)
  }
}

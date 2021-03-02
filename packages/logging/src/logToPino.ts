import * as pino from 'pino'
import { LogEvent, WriteLogEvent } from 'git-en-boite-core'

export const logToPino = (mainLogger: pino.Logger): WriteLogEvent => {
  const thePinoLogger = mainLogger.child({
    messageKey: 'message',
    serializers: { req: pino.stdSerializers.req, res: pino.stdSerializers.res },
  })
  return (event: LogEvent) => thePinoLogger[event.level](event)
}

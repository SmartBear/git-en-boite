import ErrorStackParser from 'error-stack-parser'
import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'
import { sanitize } from './sanitize'

const transports = [new winston.transports.Console()]

const sanitizeFields = sanitize(
  {
    field: 'remoteUrl',
    replace: [/(https:\/\/)([^@]+)(@.+)/, '$1***$3'],
  },
  { field: 'token' },
)

const parseErrors: winston.Logform.Format = {
  transform: (info: winston.Logform.TransformableInfo) => {
    const error = info
    if (!(error instanceof Error)) return info
    info.stack = ErrorStackParser.parse(error)
    return info
  },
}

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      parseErrors,
      sanitizeFields,
      winston.format.prettyPrint(),
      winston.format.simple(),
    ),
    transports,
  }),
  machine: winston.createLogger({
    level: 'info',
    format: winston.format.combine(parseErrors, sanitizeFields, winston.format.json()),
    transports,
  }),
}

export const createLogger = ({ readableBy }: LoggerOptions): Logger => loggers[readableBy]

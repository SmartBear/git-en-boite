import ErrorStackParser, { StackFrame } from 'error-stack-parser'
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
  transform: (anInfo: winston.Logform.TransformableInfo) => {
    const error = anInfo
    if (!(error instanceof Error)) return anInfo
    anInfo.stack = ErrorStackParser.parse(error)
    anInfo.type = error.constructor.name
    return anInfo
  },
}

const prettyPrintErrors: winston.Logform.Format = {
  transform: (anInfo: winston.Logform.TransformableInfo) => {
    const error = anInfo
    if (!(error instanceof Error)) return anInfo
    const removeFirstLineOf = (text: string) => text.substring(text.indexOf('\n') + 1)
    return Object.assign({}, error, {
      message: `${error.constructor.name}: ${error.message}\n${removeFirstLineOf(
        error.stack,
      )}\n   `,
    })
  },
}

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      prettyPrintErrors,
      sanitizeFields,
      winston.format.colorize(),
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

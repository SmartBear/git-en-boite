import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'

const transports = [new winston.transports.Console()]

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    transports,
  }),
  machine: winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports,
  }),
}

export const createLogger = ({ logger: { readableBy } }: { logger: LoggerOptions }): Logger =>
  loggers[readableBy]

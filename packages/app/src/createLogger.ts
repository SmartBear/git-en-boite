import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'
import { sanitize } from './sanitize'

const transports = [new winston.transports.Console()]

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      sanitize(
        {
          field: 'remoteUrl',
          replace: [/(https:\/\/)(\w+)(@.+)/, '$1***$3'],
        },
        { field: 'token' },
      ),
      winston.format.prettyPrint(),
      winston.format.simple(),
    ),
    transports,
  }),
  machine: winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports,
  }),
}

export const createLogger = ({ readableBy }: LoggerOptions): Logger => loggers[readableBy]

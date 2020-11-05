import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'

const sanitize = () => ({
  transform: (info: winston.Logform.TransformableInfo) => {
    for (const field of Object.keys(info)) {
      console.error(field, JSON.stringify(info[field]))
      if (field == 'remoteUrl') {
        info.remoteUrl = info.remoteUrl.replace(/(https:\/\/)(\w+)(@.+)/, '$1***$3')
      }
    }
    return info
  },
})

const transports = [new winston.transports.Console()]

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(sanitize(), winston.format.colorize(), winston.format.simple()),
    transports,
  }),
  machine: winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports,
  }),
}

export const createLogger = ({ readableBy }: LoggerOptions): Logger => loggers[readableBy]

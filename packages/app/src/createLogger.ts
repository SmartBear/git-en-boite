import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'

const sanitize = (...definitions: SantizedFieldDefinition[]) => ({
  transform: (info: winston.Logform.TransformableInfo) => {
    const sanitizers = definitions.reduce(
      (sanitizers: Record<string, SanitizesField>, { field, replace }) =>
        Object.assign(sanitizers, {
          [field]: sanitizeField(field, replace),
        }),
      {},
    )

    const recurse: SanitizesField = (object: any, field: string) => {
      object[field] = sanitizeObject(object[field])
    }
    return sanitizeObject(info)

    function sanitizeObject(object: any) {
      if (typeof object !== 'object') return object
      for (const field of Object.keys(object)) {
        const sanitizer = sanitizers[field] || recurse
        sanitizer(object, field)
      }
      return object
    }
  },
})

type SantizedFieldDefinition = {
  field: string
  replace?: [pattern: RegExp, replacement: string]
}

type SanitizesField = (anObject: any, aField: string) => void

const sanitizeField = (
  theField: string,
  replace: [pattern: RegExp, replacement: string] = [/.*/, '***'],
): SanitizesField => (anObject, aField) => {
  if (!(theField === aField)) return
  if (typeof anObject[theField] !== 'string') throw new Error('Unable to sanitize field')
  anObject[theField] = anObject[theField].replace(...replace)
}

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

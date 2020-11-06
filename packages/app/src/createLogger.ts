import { LoggerOptions } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import * as winston from 'winston'

const sanitize = (...definitions: SantizedFieldDefinition[]) => ({
  transform: (info: winston.Logform.TransformableInfo) => {
    const sanitizers = definitions
      .map(definition => new SanitizeField(definition))
      .reduce((sanitizers: Record<string, SanitizeField>, sanitizer) => {
        sanitizers[sanitizer.field] = sanitizer
        return sanitizers
      }, {})

    const recurse = {
      apply: (object: any, field: string) => {
        object[field] = sanitizeObject(object[field])
      },
    }
    return sanitizeObject(info)

    function sanitizeObject(object: any) {
      if (typeof object !== 'object') return object
      for (const field of Object.keys(object)) {
        const sanitizer = sanitizers[field] || recurse
        sanitizer.apply(object, field)
      }
      return object
    }
  },
})

type SantizedFieldDefinition = {
  field: string
  pattern?: RegExp
  replacement?: string
}

class SanitizeField {
  public readonly field
  constructor(private readonly definition: SantizedFieldDefinition) {
    this.field = definition.field
    this.definition.pattern = this.definition.pattern || /.*/
    this.definition.replacement = this.definition.replacement || '***'
  }

  appliesTo(field: string) {
    return field === this.definition.field
  }

  apply(object: any, field: string): boolean {
    if (!this.appliesTo(field)) return
    if (typeof object[field] !== 'string') throw new Error('Unable to sanitize field')
    object[field] = object[field].replace(this.definition.pattern, this.definition.replacement)
    return true
  }
}

const transports = [new winston.transports.Console()]

const loggers = {
  human: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      sanitize(
        {
          field: 'remoteUrl',
          pattern: /(https:\/\/)(\w+)(@.+)/,
          replacement: '$1***$3',
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

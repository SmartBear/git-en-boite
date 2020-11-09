import * as winston from 'winston'
import { inspect } from 'util'
import rfdc from 'rfdc'

const clone = rfdc({ circles: true })

export type SantizedFieldDefinition = {
  field: string
  replace?: [pattern: RegExp, replacement: string]
}

type SanitizeValues = (aValue: string) => void

const sanitizeField = (
  replace: [pattern: RegExp, replacement: string] = [/[\s\S]*/, '***'],
): SanitizeValues => aValue =>
  (typeof aValue !== 'string' ? inspect(aValue) : aValue).replace(...replace)

export function sanitize(...definitions: SantizedFieldDefinition[]): winston.Logform.Format {
  const sanitizerFor = definitions.reduce(
    (sanitizers: Record<string, SanitizeValues>, { field, replace }) =>
      Object.assign(sanitizers, {
        [field]: sanitizeField(replace),
      }),
    {},
  )

  return {
    transform: (info: winston.Logform.TransformableInfo): winston.Logform.TransformableInfo => {
      const fields = Object.getOwnPropertyNames(info).filter(
        key => !['level', 'message'].includes(key),
      )

      for (const field of fields) {
        const value = clone(info[field])
        info[field] = (sanitizerFor[field] || sanitizeFields)(value)
      }

      return info

      function sanitizeFields(anObject: any) {
        if (typeof anObject !== 'object') return anObject
        if (!anObject) return anObject
        for (const field of Object.getOwnPropertyNames(anObject)) {
          const value = anObject[field]
          anObject[field] = (sanitizerFor[field] || sanitizeFields)(value)
        }
        return anObject
      }
    },
  }
}

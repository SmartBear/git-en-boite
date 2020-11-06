import * as winston from 'winston'

export type SantizedFieldDefinition = {
  field: string
  replace?: [pattern: RegExp, replacement: string]
}

type Sanitizes = (anObject: any) => void

const sanitizeField = (
  theField: string,
  replace: [pattern: RegExp, replacement: string] = [/.*/, '***'],
): Sanitizes => anObject => {
  if (typeof anObject[theField] !== 'string') throw new Error('Unable to sanitize field')
  anObject[theField] = anObject[theField].replace(...replace)
}

export function sanitize(...definitions: SantizedFieldDefinition[]): winston.Logform.Format {
  const sanitizerFor = definitions.reduce(
    (sanitizers: Record<string, Sanitizes>, { field, replace }) =>
      Object.assign(sanitizers, {
        [field]: sanitizeField(field, replace),
      }),
    {},
  )

  return {
    transform: (info: winston.Logform.TransformableInfo) => {
      const recurse = (field: string) => (object: any) => {
        object[field] = sanitizeValue(object[field])
      }
      return sanitizeValue(info)

      function sanitizeValue(aValue: any) {
        if (typeof aValue !== 'object') return aValue
        for (const field of Object.keys(aValue)) {
          const sanitize = sanitizerFor[field] || recurse(field)
          sanitize(aValue)
        }
        return aValue
      }
    },
  }
}

import { WriteLogEvent } from '.'

type ErrorEnvelope = {
  type: string
  props: Record<string, unknown>
}

export const asSerializedError = <AnError extends Error>(anError: AnError): Error => {
  type Props = Record<string, unknown>
  const props = Object.getOwnPropertyNames(anError).reduce<Props>(
    (props, prop) => Object.assign(props, { [prop]: (anError as Record<string, unknown>)[prop] }),
    {}
  )
  const envelope: ErrorEnvelope = { props, type: anError.constructor.name }
  return new Error(JSON.stringify(envelope))
}

type ErrorConstructor = {
  new (message?: string): Error
}

export const buildDeserializeError = (...constructors: Array<ErrorConstructor>) => (
  anError: Error,
  log: WriteLogEvent
): Error => {
  if (!hasSerializedMessage(anError)) return anError
  const errorEnvelope: ErrorEnvelope = JSON.parse(anError.message)
  const Constructor = constructors.find((constructor) => constructor.name === errorEnvelope.type)
  if (!Constructor) {
    log({
      level: 'warn',
      message: `Unable to properly deserialize an Error of type: ${errorEnvelope.type}. Add the constructor to ${__filename}. Returning as a regular Error for now.`,
    })
  }
  return Object.assign(new (Constructor || Error)(), errorEnvelope.props)

  function hasSerializedMessage(error: Error) {
    try {
      return JSON.parse(error.message) instanceof Object
    } catch (parseError) {
      if (parseError instanceof SyntaxError) return false
      throw parseError
    }
  }
}

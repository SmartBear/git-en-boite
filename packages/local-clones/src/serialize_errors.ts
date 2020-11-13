import { AccessDenied, InvalidRepoUrl, Logger } from 'git-en-boite-core'

type ErrorEnvelope = {
  type: string
  props: Record<string, unknown>
}

export const asSerializedError = <AnError extends Error>(anError: AnError): Error => {
  type Props = Record<string, unknown>
  const props = Object.getOwnPropertyNames(anError).reduce<Props>(
    (props, prop) => Object.assign(props, { [prop]: (anError as Record<string, unknown>)[prop] }),
    {},
  )
  const envelope: ErrorEnvelope = { props, type: anError.constructor.name }
  return new Error(JSON.stringify(envelope))
}

const buildDeserializeError = (...constructors: Array<{ new (message?: string): Error }>) => (
  anError: Error,
  logger: Logger,
): Error => {
  if (!hasSerializedMessage(anError)) return anError
  const errorEnvelope: ErrorEnvelope = JSON.parse(anError.message)
  const Constructor = constructors.find(constructor => constructor.name === errorEnvelope.type)
  if (!Constructor) {
    logger.warn(
      `Unable to properly deserialize an Error of type: ${errorEnvelope.type}. Add the constructor to ${__filename}. Returning as a regular Error for now.`,
    )
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

export const deserialize = buildDeserializeError(InvalidRepoUrl, AccessDenied, Error)

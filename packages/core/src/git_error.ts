type ErrorEnvelope = {
  type: string
  props: {
    message: string
    stack: string
  } & any
}

const hasSerializedMessage = (error: Error) => {
  try {
    return JSON.parse(error.message) instanceof Object
  } catch (error) {
    if (error instanceof SyntaxError) return false
    throw error
  }
}

export abstract class GitError extends Error {
  static deserialise(anError: Error): GitError | Error {
    if (!hasSerializedMessage(anError)) {
      return anError
    }
    const errorEnvelope = JSON.parse(anError.message)
    for (const ErrorType of types) {
      if (errorEnvelope.type !== ErrorType.name) continue
      const result = new ErrorType()
      Object.assign(result, errorEnvelope.props)
      return result
    }
    return anError
  }

  asSerializedError(): Error {
    const envelope: ErrorEnvelope = { props: this.toJSON(), type: this.constructor.name }
    return new Error(JSON.stringify(envelope))
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    Object.getOwnPropertyNames(this).forEach(prop => {
      result[prop] = (this as any)[prop]
    })
    return result
  }
}

export class AccessDenied extends GitError {
  public readonly message = 'Access denied'
}

export class InvalidRepoUrl extends GitError {}

const types = [AccessDenied, InvalidRepoUrl]

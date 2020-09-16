export class GitError extends Error {
  static deserialise(serialisedError: Error): GitError | Error {
    for (const ErrorType of [AccessDenied, NotFound]) {
      if (serialisedError.message !== new ErrorType().message) {
        continue
      }
      const result = new ErrorType()
      result.stack = serialisedError.stack
      return result
    }
    return serialisedError
  }
}

export class AccessDenied extends GitError {
  public readonly message = 'Access denied'
}

export class NotFound extends GitError {
  public readonly message = 'Not found'
}

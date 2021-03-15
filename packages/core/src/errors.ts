export class DomainError extends Error {
  constructor(message = '') {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class AccessDenied extends DomainError {
  constructor(message = 'Access denied') {
    super(message)
  }
}

export class LockedByAnotherProcess extends DomainError {
  constructor(message = 'The local repo is currently in use by another process. Please try again in a moment.') {
    super(message)
  }
}

export class InvalidRepoUrl extends DomainError {}

//TODO: throw this accordingly
export class Unauthorized extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message)
  }
}

export class FileNotFound extends DomainError {
  constructor(message = 'File not found') {
    super(message)
  }
}

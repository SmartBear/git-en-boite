class DomainError extends Error {
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

export class InvalidRepoUrl extends DomainError {}

export class GitError extends Error {}

export class AccessDenied extends GitError {
  constructor() {
    super('Access denied')
  }
}

export class NotFound extends GitError {
  constructor() {
    super('Not found')
  }
}

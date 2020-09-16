export class GitError extends Error {}

export class AccessDenied extends GitError {
  public readonly message = 'Access denied'
}

export class NotFound extends GitError {
  public readonly message = 'Not found'
}

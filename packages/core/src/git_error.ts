export class AccessDenied extends Error {
  public readonly message = 'Access denied'
}

export class InvalidRepoUrl extends Error {}

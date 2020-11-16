import { RepoId } from './repo_id'

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

export class NoSuchRepo extends DomainError {
  constructor(message = 'No such repository', public readonly repoId: RepoId) {
    super(message)
  }
}

export class RepoAlreadyExists extends DomainError {
  constructor(message = 'Repository already exists in inventory', public readonly repoId: RepoId) {
    super(message)
  }
}

import { IGitResult } from 'dugite'
import { AccessDenied, LockedByAnotherProcess } from 'git-en-boite-core'

export class GitCommandError extends Error {
  static for(cmd: string, args: string[], result: IGitResult): AccessDenied | GitCommandError {
    if (result.stderr.match(/terminal prompts disabled/)) {
      return new AccessDenied('The server asked for authentication.')
    }
    if (result.stderr.match(/SAML SSO(.|\s)*URL returned error: 403/)) {
      return new AccessDenied('Please enable SSO for your token.')
    }
    if (
      result.stderr.match(
        /Another git process seems to be running in this repository|shallow file has changed since we read it/
      )
    ) {
      return new LockedByAnotherProcess()
    }
    return new this(result.stderr, cmd, args, result)
  }

  constructor(
    message: string,
    public readonly cmd?: string,
    public readonly args?: string[],
    public readonly result?: IGitResult
  ) {
    super(message)
  }
}

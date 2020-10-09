import { AccessDenied, InvalidRepoUrl } from 'git-en-boite-core'
import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { GitCommandError } from '../git_command_error'

import { GitDirectory } from '../git_directory'
import { ValidateRemote } from '../operations'

export const handleValidateRemote: Handle<GitDirectory, AsyncCommand<ValidateRemote>> = async (
  repo,
  { url },
) => {
  await repo.exec('ls-remote', [url.value]).catch((error: AccessDenied | GitCommandError) => {
    if (error instanceof AccessDenied) throw error
    throw new InvalidRepoUrl(error.message)
  })
}

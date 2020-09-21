import { ValidateRemote } from '../operations'
import { Handle, AsyncCommand } from 'git-en-boite-message-dispatch'
import { GitDirectory } from '../git_directory'
import { AccessDenied, InvalidRepoUrl } from 'git-en-boite-core'

export const handleValidateRemote: Handle<GitDirectory, AsyncCommand<ValidateRemote>> = async (
  repo,
  { url },
) => {
  await repo.exec('ls-remote', [url.value]).catch(error => {
    if (error instanceof AccessDenied) throw error
    throw new InvalidRepoUrl()
  })
}

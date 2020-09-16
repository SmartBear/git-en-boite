import { ValidateRemote } from '../operations'
import { Handle, AsyncCommand } from 'git-en-boite-message-dispatch'
import { GitDirectory } from '../git_directory'
import { NotFound } from 'git-en-boite-core'

export const handleValidateRemote: Handle<GitDirectory, AsyncCommand<ValidateRemote>> = async (
  repo,
  { url },
) => {
  await repo.exec('ls-remote', [url.value]).catch(error => {
    if (
      error.message.match(
        /not found|the requested url returned error|does not appear to be a git repository/i,
      )
    ) {
      throw new NotFound()
    }
    throw error
  })
}

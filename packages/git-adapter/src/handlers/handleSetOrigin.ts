import { SetOrigin } from 'git-en-boite-git-port'
import { Handle, AsyncCommand } from 'git-en-boite-message-dispatch'
import { GitDirectory } from '../git_directory'

export const handleSetOrigin: Handle<GitDirectory, AsyncCommand<SetOrigin>> = async (
  repo,
  { url },
) => {
  await repo.execGit('remote', ['add', 'origin', url])
}

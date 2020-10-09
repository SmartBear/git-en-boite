import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Push } from '../operations'
import { GitDirectory } from '../git_directory'

export const handlePush: Handle<GitDirectory, AsyncCommand<Push>> = async (
  repo: GitDirectory,
  { commitRef },
) => {
  await repo.exec('push', ['origin', `${commitRef.local}:${commitRef.remote}`])
}

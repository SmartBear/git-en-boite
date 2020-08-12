import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Push } from '../operations'
import { GitDirectory } from '../git_directory'

export const handlePush: Handle<GitDirectory, AsyncCommand<Push>> = async (
  repo: GitDirectory,
  { refName, branchName },
) => {
  await repo.execGit('push', ['origin', `${refName}:refs/heads/${branchName}`])
}

import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Fetch } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleFetch: Handle<GitDirectory, AsyncCommand<Fetch>> = async (repo) => {
  await repo.exec('fetch', ['origin', '--depth=1'])
}

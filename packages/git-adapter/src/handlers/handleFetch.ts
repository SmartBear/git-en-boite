import { AsyncCommand, Handle } from 'git-en-boite-command-bus'
import { Fetch } from 'git-en-boite-git-port'
import { GitDirectory } from '../git_directory'

export const handleFetch: Handle<GitDirectory, AsyncCommand<Fetch>> = async repo => {
  await repo.execGit('fetch', ['origin', '--depth=1'])
}

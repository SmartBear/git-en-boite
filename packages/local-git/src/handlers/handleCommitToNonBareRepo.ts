import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Commit } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleCommitToNonBareRepo: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { message, author },
) => {
  await repo.execGit('commit', ['--allow-empty', '-m', message], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

import { Commit } from 'git-en-boite-git-port'

import { Handler } from './handler'

export const handleCommit: Handler<Commit> = async (repo, { message, author }) => {
  await repo.execGit('commit', ['--allow-empty', '-m', message], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

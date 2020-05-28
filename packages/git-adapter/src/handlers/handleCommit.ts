import { Commit } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleCommit: HandlesGitOperations<Commit> = async (repo, { message, author }) => {
  await repo.execGit('commit', ['--allow-empty', '-m', message], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

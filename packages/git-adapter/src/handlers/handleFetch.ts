import { Fetch } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleFetch: HandlesGitOperations<Fetch> = async repo => {
  await repo.execGit('fetch', ['origin'])
}

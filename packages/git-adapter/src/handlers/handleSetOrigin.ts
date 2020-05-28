import { SetOrigin } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleSetOrigin: HandlesGitOperations<SetOrigin> = async (repo, { url }) => {
  await repo.execGit('remote', ['add', 'origin', url])
}

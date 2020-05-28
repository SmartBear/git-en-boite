import { GetRevision } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleGetRevision: HandlesGitOperations<GetRevision, string> = async (
  repo,
  { reference },
) => (await repo.execGit('rev-parse', [reference])).stdout.trim()

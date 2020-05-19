import { GetRevision } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleGetRevision: Handler<GetRevision, string> = async (repo, { reference }) =>
  (await repo.execGit('rev-parse', reference)).stdout.trim()

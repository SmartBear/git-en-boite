import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { GetRevision } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetRevision: Handle<GitDirectory, AsyncQuery<GetRevision, string>> = async (
  repo,
  { reference },
) => (await repo.execGit('rev-parse', [reference])).stdout.trim()

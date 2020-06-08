import { AsyncQuery, Handle } from 'git-en-boite-command-bus'
import { GetRevision } from 'git-en-boite-git-port'
import { GitDirectory } from '../git_directory'

export const handleGetRevision: Handle<GitDirectory, AsyncQuery<GetRevision, string>> = async (
  repo,
  { reference },
) => (await repo.execGit('rev-parse', [reference])).stdout.trim()

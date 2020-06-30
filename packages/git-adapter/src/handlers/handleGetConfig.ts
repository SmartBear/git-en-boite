import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { Config, GetConfig } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetConfig: Handle<GitDirectory, AsyncQuery<GetConfig, Config>> = async (
  repo,
  { scope },
) => {
  const { stdout } = await repo.execGit('config', [`--${scope}`, '--list'])
  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim().split('='))
    .reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
}

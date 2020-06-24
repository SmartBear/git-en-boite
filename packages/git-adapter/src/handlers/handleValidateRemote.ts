import { ValidateRemote } from 'git-en-boite-git-port'
import { Handle, AsyncCommand } from 'git-en-boite-command-bus'
import { GitDirectory } from '../git_directory'

export const handleValidateRemote: Handle<GitDirectory, AsyncCommand<ValidateRemote>> = async (
  repo,
  { url },
) => {
  await repo.execGit('ls-remote', [url], {
    env: {
      GIT_TERMINAL_PROMPT: 0,
      GIT_ASKPASS: '$echo',
    },
  })
}

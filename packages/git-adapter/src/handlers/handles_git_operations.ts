import { HandleCommands } from 'git-en-boite-command-bus'

import { GitDirectory } from '../git_directory'

export type HandlesGitOperations<Command, Result = void> = HandleCommands<
  GitDirectory,
  Command,
  Promise<Result>
>

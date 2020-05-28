import { HandlesCommands } from 'git-en-boite-command-bus'

import { GitDirectory } from '../git_directory'

export type HandlesGitOperations<Command, Result = void> = HandlesCommands<
  GitDirectory,
  Command,
  Promise<Result>
>

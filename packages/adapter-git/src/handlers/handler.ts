import { GitDirectory } from '../git_directory'

export type Handler<Command, Result = void> = (
  repo: GitDirectory,
  command: Command,
) => Promise<Result>

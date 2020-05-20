import { GitRepo } from '../git_repo'

export type Handler<Command, Result = void> = (repo: GitRepo, command: Command) => Promise<Result>

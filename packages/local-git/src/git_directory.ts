import { GitProcess, IGitExecutionOptions, IGitResult } from 'dugite'

export class GitDirectory {
  path: string

  constructor(path: string) {
    this.path = path
  }

  async execGit(
    cmd: string,
    args: string[] = [],
    options?: IGitExecutionOptions,
  ): Promise<IGitResult> {
    const gitOptions = this.buildGitOptions(options)
    const result = await GitProcess.exec([cmd, ...args], this.path, gitOptions)
    if (result.exitCode !== 0) {
      throw new Error(
        `Git command \`${cmd} ${args.join(' ')}\` returned exit code ${result.exitCode}:\n${
          result.stderr
        }`,
      )
    }
    return result
  }

  protected buildGitOptions(options?: IGitExecutionOptions): IGitExecutionOptions {
    const optionsEnv = options ? options.env : {}

    return {
      ...options,
      ...{ env: { ...optionsEnv, ...{ GIT_TERMINAL_PROMPT: 0, GIT_ASKPASS: null } } },
    }
  }
}

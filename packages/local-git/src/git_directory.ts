import { GitProcess, IGitExecutionOptions, IGitResult } from 'dugite'

export class GitDirectory {
  path: string

  constructor(path: string) {
    this.path = path
  }

  async read(cmd: string, args: string[] = [], options?: IGitExecutionOptions): Promise<string> {
    return (await this.exec(cmd, args, options)).stdout.trim()
  }

  async exec(
    cmd: string,
    args: string[] = [],
    options?: IGitExecutionOptions,
  ): Promise<IGitResult> {
    const result = await GitProcess.exec([cmd, ...args], this.path, this.buildOptions(options))
    if (result.exitCode !== 0) {
      throw new Error(
        `Git command \`${cmd} ${args.join(' ')}\` returned exit code ${result.exitCode}:\n${
          result.stderr
        }`,
      )
    }
    return result
  }

  private buildOptions(options: IGitExecutionOptions = {}): IGitExecutionOptions {
    return {
      ...options,
      env: { GIT_TERMINAL_PROMPT: 0, GIT_ASKPASS: null },
    }
  }
}

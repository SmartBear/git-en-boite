import { GitProcess, IGitExecutionOptions, IGitResult } from 'dugite'
import { merge } from 'lodash'

export class GitDirectory {
  constructor(public readonly path: string, public readonly options: IGitExecutionOptions = {}) {}

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
    return merge(this.options, options, { env: { GIT_TERMINAL_PROMPT: 0, GIT_ASKPASS: null } })
  }
}

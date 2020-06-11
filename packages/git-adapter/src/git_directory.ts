import { GitProcess, IGitResult, IGitExecutionOptions } from 'dugite'

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
    const result = await GitProcess.exec([cmd, ...args], this.path, options)
    if (result.exitCode !== 0) {
      throw new Error(
        `Git command \`${cmd} ${args.join(' ')}\` returned exit code ${result.exitCode}:\n${
          result.stderr
        }`,
      )
    }
    return result
  }
}

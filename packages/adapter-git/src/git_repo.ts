import { GitProcess, IGitResult } from 'dugite'

export class GitRepo {
  path: string

  constructor(path: string) {
    this.path = path
  }

  async execGit(cmd: string, ...args: string[]): Promise<IGitResult> {
    const result = await GitProcess.exec([cmd, ...args], this.path)
    if (result.exitCode !== 0) {
      throw new Error(`Git command failed: ${result.stderr}`)
    }
    return result
  }
}

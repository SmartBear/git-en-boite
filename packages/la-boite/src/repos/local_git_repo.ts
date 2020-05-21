import { GitProcess, IGitResult } from 'dugite'
import { Reference } from './interfaces'
import fs from 'fs'

export class LocalGitRepo {
  path: string

  static async open(path: string) {
    fs.mkdirSync(path, { recursive: true })
    return new this(path)
  }

  protected constructor(path: string) {
    this.path = path
  }

  private async execGit(cmd: string, ...args: string[]): Promise<IGitResult> {
    const result = await GitProcess.exec([cmd, ...args], this.path)
    if (result.exitCode !== 0) {
      throw new Error(`Git command failed: ${result.stderr}`)
    }
    return result
  }

  async refs(): Promise<Reference[]> {
    const { stdout } = await this.execGit('show-ref')
    return stdout
      .trim()
      .split('\n')
      .map(line => line.trim().split(' '))
      .map(([revision, name]) => ({ revision, name }))
  }
}

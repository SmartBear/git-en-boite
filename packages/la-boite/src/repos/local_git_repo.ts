import { GitRepo, Reference } from './interfaces'
import { GitProcess, IGitResult } from 'dugite'
import fs from 'fs'

export class LocalGitRepo implements GitRepo {
  path: string

  static async open(path: string) {
    fs.mkdirSync(path, { recursive: true })
    return new this(path)
  }

  constructor(path: string) {
    this.path = path
  }

  async git(cmd: string, ...args: string[]): Promise<IGitResult> {
    const result = await GitProcess.exec([cmd, ...args], this.path)
    if (result.exitCode > 0) throw new Error(result.stderr)
    return result
  }

  async refs(): Promise<Reference[]> {
    const { stdout } = await this.git('show-ref')
    return stdout
      .trim()
      .split('\n')
      .map(line => line.trim().split(' '))
      .map(([revision, name]) => ({ revision, name }))
  }
}

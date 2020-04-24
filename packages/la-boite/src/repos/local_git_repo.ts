import { GitRepo } from './git_repo'
import { Repository } from 'nodegit'
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

  async refs(): Promise<string[]> {
    const { stdout } = await this.git('show-ref')
    return stdout
      .trim()
      .split('\n')
      .map(line => line.split(' ')[1])
  }

  async branches(): Promise<string[]> {
    const repo = await Repository.open(this.path)
    const refs = await repo.getReferences()
    return refs
      .filter(ref => ref.isBranch())
      .filter(ref => !ref.isRemote())
      .map(ref => ref.name())
      .map(refName => refName.split('/')[2])
  }
}

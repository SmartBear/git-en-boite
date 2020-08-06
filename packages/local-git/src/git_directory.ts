import { GitProcess, IGitExecutionOptions, IGitResult } from 'dugite'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { File } from 'git-en-boite-core'

const unlink = promisify(fs.unlink)

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

  async clearIndex(): Promise<void> {
    try {
      await unlink(path.resolve(this.path, 'index'))
    } catch (err) {}
  }

  async addFileToIndex(file: File): Promise<void> {
    const objectId = (
      await this.execGit('hash-object', ['-w', '--stdin'], { stdin: file.content })
    ).stdout.trim()
    await this.execGit('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
  }

  protected buildGitOptions(options?: IGitExecutionOptions): IGitExecutionOptions {
    const optionsEnv = options ? options.env : {}

    return {
      ...options,
      ...{ env: { ...optionsEnv, ...{ GIT_TERMINAL_PROMPT: 0, GIT_ASKPASS: null } } },
    }
  }
}

import { GitProcess, IGitExecutionOptions, IGitResult } from 'dugite'
import { merge } from 'lodash'
import path from 'path'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import { promisify } from 'util'
import { AccessDenied, NotFound } from 'git-en-boite-core'

const unlink = promisify(fs.unlink)
const exists = promisify(fs.exists)

type OperateOnIndex<Result = void> = (index: GitDirectory) => Promise<Result>

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
      if (result.stderr.match(/terminal prompts disabled/)) {
        throw new AccessDenied()
      }
      // TODO: test this logic
      if (result.stderr.match(/repository not found/)) {
        throw new NotFound()
      }
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

  async withUniqueIndex<Result = void>(operateOnIndex: OperateOnIndex<Result>): Promise<Result> {
    const indexFile = path.resolve(this.path, `index-${uuid()}`)
    const result = await operateOnIndex(
      new GitDirectory(this.path, {
        env: { GIT_INDEX_FILE: indexFile },
      }),
    )
    if (await exists(indexFile)) await unlink(indexFile)
    return result
  }
}

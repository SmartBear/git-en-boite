import { GitRepo, Reference } from './interfaces'
import { GitProcess, IGitResult } from 'dugite'
import fs from 'fs'

abstract class Command {}

interface Commit extends Command {
  message: string
}

interface GitInteraction {
  ({ git }: { git: (...args: string[]) => Promise<IGitResult> }): Promise<IGitResult | void>
}

// TODO: how to cast this 'any' as a generic handler
const handlers = new Map<string, any>()
// TODO: how to remove duplication of 'Commmit' key and Commit type here.
handlers.set(
  'Commit',
  ({ message }: Commit): GitInteraction => async ({ git }) =>
    git('commit', '--allow-empty', '-m', message),
)
console.log(handlers)

export class LocalGitRepo implements GitRepo {
  path: string

  static async open(path: string) {
    fs.mkdirSync(path, { recursive: true })
    return new this(path)
  }

  constructor(path: string) {
    this.path = path
  }

  async do(commandName: string, command: Command): Promise<IGitResult | void> {
    const handler = handlers.get(commandName)
    const interaction = handler(command)
    return interaction({ git: this.git.bind(this) })
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

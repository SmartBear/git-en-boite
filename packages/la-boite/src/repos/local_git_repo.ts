import { GitRepo, Reference } from './interfaces'
import { GitProcess, IGitResult } from 'dugite'
import fs from 'fs'

abstract class Command {}

export class Commit extends Command {
  constructor(public readonly message: string, public readonly branchName: string) {
    super()
  }

  static withMessage(message: string) {
    return new Commit(message, 'master')
  }

  onBranch(branchName: string): Commit {
    return new Commit(this.message, branchName)
  }
}

export class Init extends Command {
  constructor(public readonly isBare: boolean) {
    super()
  }

  static bareRepo() {
    return new Init(true)
  }

  static withWorkingDirectory() {
    return new Init(false)
  }
}

interface GitInteraction {
  ({ git }: { git: (...args: string[]) => Promise<IGitResult> }): Promise<IGitResult | void>
}

export interface Type<T> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
}

export interface Handler<CommandType> {
  (command: CommandType): GitInteraction
}

// TODO: how to cast this 'any' as a generic handler
const handlers = new Map<Command, any>()
function addHandler<CommandType>(commandType: Type<CommandType>, handler: Handler<CommandType>) {
  handlers.set(commandType, handler)
}
addHandler(Commit, ({ message, branchName }) => async ({ git }) => {
  await git('config', 'user.email', 'test@example.com')
  await git('config', 'user.name', 'Test User')
  await git('checkout', '-b', branchName)
  await git('commit', '--allow-empty', '-m', message)
})
addHandler(Init, ({ isBare }) => async ({ git }) => git('init', ...(isBare ? ['--bare'] : [])))

export class LocalGitRepo implements GitRepo {
  path: string

  static async open(path: string) {
    fs.mkdirSync(path, { recursive: true })
    return new this(path)
  }

  constructor(path: string) {
    this.path = path
  }

  async do(command: Command): Promise<IGitResult | void> {
    console.log(command)
    const handle = handlers.get(command.constructor)
    const interaction = handle(command)
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

import { GitProcess, IGitResult } from 'dugite'
import { CommandBus } from 'git-en-boite-command-bus'
import { GitRepo, Reference } from './interfaces'
import fs from 'fs'

export class Commit {
  constructor(public readonly message: string, public readonly branchName: string) {}

  static withMessage(message: string) {
    return new Commit(message, 'master')
  }

  onBranch(branchName: string): Commit {
    return new Commit(this.message, branchName)
  }
}

export class Init {
  constructor(public readonly isBare: boolean) {}

  static bareRepo() {
    return new Init(true)
  }

  static withWorkingDirectory() {
    return new Init(false)
  }
}

type Commands = Init | Commit

const handleInit = (repo: LocalGitRepo, command: Init) =>
  repo.git('init', ...(command.isBare ? ['--bare'] : []))

const handleCommit = async (repo: LocalGitRepo, command: Commit) => {
  const { branchName, message } = command
  await repo.git('config', 'user.email', 'test@example.com')
  await repo.git('config', 'user.name', 'Test User')
  await repo.git('checkout', '-b', branchName)
  await repo.git('commit', '--allow-empty', '-m', message)
}

export class LocalGitRepo implements GitRepo {
  path: string

  static async openForCommands(path: string) {
    const repo = await this.open(path)
    const commandBus = new CommandBus<LocalGitRepo, Commands>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(Commit, handleCommit)
    return commandBus.do.bind(commandBus)
  }

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

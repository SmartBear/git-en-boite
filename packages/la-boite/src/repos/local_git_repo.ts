import { GitProcess, IGitResult } from 'dugite'
import { CommandBus } from 'git-en-boite-command-bus'
import { GitRepo, Reference } from './interfaces'
import fs from 'fs'

export class Commit {
  protected constructor(public readonly message: string) {}

  static withMessage(message: string) {
    return new Commit(message)
  }
}

export class Init {
  protected constructor(public readonly isBare: boolean) {}

  static bareRepo() {
    return new Init(true)
  }

  static withWorkingDirectory() {
    return new Init(false)
  }
}

export class Misc {
  protected constructor(public readonly command: string, public readonly args: string[]) {}

  static command(name: string) {
    return new Misc(name, [])
  }

  withArgs(...args: string[]) {
    return new Misc(this.command, args)
  }
}

export class EnsureBranchExists {
  protected constructor(public readonly name: string) {}

  static named(name: string) {
    return new EnsureBranchExists(name)
  }
}

type Commands = Init | Commit | Misc | EnsureBranchExists

const handleInit = (repo: LocalGitRepo, command: Init) =>
  repo.git('init', ...(command.isBare ? ['--bare'] : []))

const handleCommit = async (repo: LocalGitRepo, command: Commit) => {
  const { message } = command
  await repo.git('config', 'user.email', 'test@example.com')
  await repo.git('config', 'user.name', 'Test User')
  await repo.git('commit', '--allow-empty', '-m', message)
}

const handleMisc = async (repo: LocalGitRepo, { command, args }: Misc) => repo.git(command, ...args)

const handleEnsureBranchExists = async (repo: LocalGitRepo, { name }: EnsureBranchExists) => {
  const verifyBranchExists = await repo.git('rev-parse', '--verify', name)
  if (!(verifyBranchExists.exitCode === 0)) await repo.git('branch', name, 'HEAD')
}

export class LocalGitRepo implements GitRepo {
  path: string

  static async openForCommands(path: string) {
    const repo = await this.open(path)
    const commandBus = new CommandBus<LocalGitRepo, Commands>(repo)
    commandBus.handle(Init, handleInit)
    commandBus.handle(Commit, handleCommit)
    commandBus.handle(Misc, handleMisc)
    commandBus.handle(EnsureBranchExists, handleEnsureBranchExists)
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
    return await GitProcess.exec([cmd, ...args], this.path)
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

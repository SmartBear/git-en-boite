import childProcess from 'child_process'
import { GitProcess } from 'dugite'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import { Commit, GetRefs, Init } from 'git-en-boite-git-port'
import { equalTo, fulfilled, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleGetRefs } from './handleGetRefs'
import { handleInit } from './handleInit'

const exec = promisify(childProcess.exec)
const root = path.resolve(__dirname, '../../tmp')
type Operation = Init | Commit | GetRefs

describe('handleGetRefs', () => {
  const repoPath = path.resolve(root, 'a-repo-id')
  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  const repo = (repoPath: string) => {
    fs.mkdirSync(repoPath, { recursive: true })
    const repo = new GitDirectory(repoPath)
    const commandBus = new CommandBus<GitDirectory, Operation>(repo)
      .handle(Init, handleInit)
      .handle(Commit, handleCommit)
      .handle(GetRefs, handleGetRefs)
    return commandBus.dispatch.bind(commandBus)
  }

  const revisionForBranch = async (branchName: string) => {
    const result = await GitProcess.exec(['rev-parse', branchName], repoPath)
    return result.stdout.trim()
  }

  let git: (operation: Operation) => Promise<void | Ref[]>

  context('in a non-bare repo', () => {
    beforeEach(async () => {
      git = repo(repoPath)
      await git(Init.normalRepo())
    })

    context('with no commits in the repo', () => {
      it('fails', async () => {
        await promiseThat(git(GetRefs.all()), rejected())
      })
    })

    context('with a commit to the master branch', () => {
      beforeEach(async () => {
        await git(Commit.withAnyMessage())
      })

      it('returns the revision of the latest commit', async () => {
        await promiseThat(
          git(GetRefs.all()),
          fulfilled(equalTo([new Ref(await revisionForBranch('master'), 'refs/heads/master')])),
        )
      })
    })
  })

  context('in a bare repo', () => {
    beforeEach(async () => {
      git = repo(repoPath)
      await git(Init.bareRepo())
    })

    context('with a remote branch', () => {
      it('returns a ref for the remote branch')
    })
  })
})

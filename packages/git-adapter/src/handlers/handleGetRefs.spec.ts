import childProcess from 'child_process'
import fs from 'fs'
import { CommandBus } from 'git-en-boite-command-bus'
import { Commit, Init, EnsureBranchExists, GetRevision, GetRefs } from 'git-en-boite-git-port'
import { fulfilled, promiseThat, rejected, equalTo } from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from '../git_directory'
import { handleCommit } from './handleCommit'
import { handleInit } from './handleInit'
import { handleGetRefs } from './handleGetRefs'
import { GitProcess } from 'dugite'
import { Ref } from 'git-en-boite-core'

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
    commandBus.handle(Init, handleInit).handle(Commit, handleCommit).handle(GetRefs, handleGetRefs)
    return commandBus.do.bind(commandBus)
  }

  const revisionForBranch = async (branchName: string) => {
    const result = await GitProcess.exec(['rev-parse', branchName], repoPath)
    return result.stdout.trim()
  }

  let git: (operation: Operation) => Promise<void>

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

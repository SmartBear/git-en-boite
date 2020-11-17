import fs from 'fs'
import { LocalClones, RepoAlreadyExists } from 'git-en-boite-core'
import { assertThat, equalTo, instanceOf, promiseThat, rejected } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GetConfig, openBareRepo } from '..'
import { GitDirectory } from '../git_directory'

export const verifyLocalClonesContract = (makeLocalClones: () => LocalClones): void => {
  let root: string
  let repoPath: string
  let localClones: LocalClones

  beforeEach(() => {
    root = dirSync().name
    localClones = makeLocalClones()
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('creating a new LocalClone', () => {
    context('when the directory does not exist', () => {
      beforeEach(() => (repoPath = path.resolve(root, 'a-new-repo-id')))

      it('creates an initialised repo', async () => {
        await localClones.createNew(repoPath)
        const git = await openBareRepo(repoPath)
        const config = await git(GetConfig.forRepo())
        await assertThat(config['user.name'], equalTo('Git en boîte'))
      })
    })

    context('when the directory already exists', () => {
      beforeEach(() => (repoPath = path.resolve(root, 'an-existing-repo-id')))
      beforeEach(() => fs.mkdirSync(repoPath, { recursive: true }))

      it('fails', async () => {
        await promiseThat(localClones.createNew(repoPath), rejected())
      })
    })
  })

  describe('opening an existing LocalClone', () => {
    context('when the directory does not exist', () => {
      beforeEach(() => (repoPath = path.resolve(root, 'a-new-repo-id')))

      it('fails', async () => {
        await promiseThat(localClones.openExisting(repoPath), rejected())
      })
    })

    context('when the directory already exists', () => {
      beforeEach(() => (repoPath = path.resolve(root, 'an-existing-repo-id')))
      beforeEach(() => fs.mkdirSync(repoPath, { recursive: true }))

      it('opens the existing repo directory without initialising it', async () => {
        await new GitDirectory(repoPath).exec('init')
        await localClones.openExisting(repoPath)
        const git = await openBareRepo(repoPath)
        const config = await git(GetConfig.forRepo())
        await assertThat(config['user.name'], undefined)
      })
    })
  })
}

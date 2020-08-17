import fs from 'fs'
import { BranchName, File, PendingCommitRef, RefName } from 'git-en-boite-core'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import {
  assertThat,
  containsString,
  containsStrings,
  equalTo,
  fulfilled,
  not,
  promiseThat,
  containsInAnyOrder,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { handleCommit, handleFetch, handleInit, handleSetOrigin } from '.'
import { LocalCommitRef } from '..'
import { GitDirectory } from '../git_directory'
import { Commit, Fetch, Init, SetOrigin } from '../operations'

type Protocol = [
  AsyncCommand<Commit>,
  AsyncCommand<Init>,
  AsyncCommand<Fetch>,
  AsyncCommand<SetOrigin>,
]

describe('handleCommit', () => {
  const branchName = 'a-branch'
  let root: string
  let repoPath: string
  let git: Dispatch<Protocol>
  let repo: GitDirectory

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    fs.mkdirSync(repoPath, { recursive: true })
    repo = new GitDirectory(repoPath)
    git = messageDispatch<Protocol>().withHandlers(repo, [
      [Commit, handleCommit],
      [Init, handleInit],
      [Fetch, handleFetch],
      [SetOrigin, handleSetOrigin],
    ])
    await git(Init.bareRepo())
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  it('creates an empty commit with the given message', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)

    await git(Commit.toCommitRef(localCommitRef).withMessage('A commit message'))
    await promiseThat(
      repo.read('log', [localCommitRef.local.value, '--oneline']),
      fulfilled(containsString('A commit message')),
    )
  })

  it('creates a commit containing the given files', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)

    const file = { path: 'a.file', content: 'some content' }
    await git(Commit.toCommitRef(localCommitRef).withFiles([file]))
    await promiseThat(
      repo.read('ls-tree', [localCommitRef.local.value, '-r', '--name-only']),
      fulfilled(containsString(file.path)),
    )
  })

  it('clears the index before committing the index with no parent', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)

    const file = { path: 'a.file', content: 'some content' }
    const objectId = await repo.read('hash-object', ['-w', '--stdin'], { stdin: 'Junk file' })
    await repo.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, 'junk.file'])
    await git(Commit.toCommitRef(localCommitRef).withFiles([file]))

    await promiseThat(
      repo.read('ls-tree', [localCommitRef.local.value, '-r', '--name-only']),
      fulfilled(not(containsString('junk.file'))),
    )
  })

  describe('to a local branch', () => {
    const commitRef = LocalCommitRef.forBranch(branchName)

    it('creates a commit with a parent', async () => {
      await git(Commit.toCommitRef(commitRef).withMessage('initial commit'))
      await git(Commit.toCommitRef(commitRef).withMessage('A commit message'))
      await promiseThat(
        repo.read('log', [commitRef.local.value, '--oneline']),
        fulfilled(containsStrings('initial commit', 'A commit message')),
      )
    })
  })

  describe('to a remote branch', () => {
    it('creates a commit using the existing tree', async () => {
      const existingFile = { path: 'a.file', content: 'some content' }
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchName),
          branchName: BranchName.of(branchName),
          parent: RefName.fetchedFromOrigin(branchName),
        }).withFiles([existingFile]),
      )

      const otherFile = { path: 'b.file', content: 'another content' }
      const commitRef = PendingCommitRef.forBranch(branchName)
      await git(Commit.toCommitRef(commitRef).withFiles([otherFile]))

      await promiseThat(
        repo.read('ls-tree', [commitRef.local.value, '-r', '--name-only']),
        fulfilled(containsStrings(existingFile.path, otherFile.path)),
      )
    })

    it('creates a commit with a parent', async () => {
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchName),
          branchName: BranchName.of(branchName),
          parent: RefName.fetchedFromOrigin(branchName),
        }).withMessage('initial commit'),
      )
      const commitRef = PendingCommitRef.forBranch(branchName)
      await git(Commit.toCommitRef(commitRef).withMessage('A commit message'))
      await promiseThat(
        repo.read('log', [commitRef.local.value, '--oneline']),
        fulfilled(containsStrings('initial commit', 'A commit message')),
      )
    })
  })

  describe('handling concurrent commits to the same repo', () => {
    const mainFile: File = { path: 'main.file', content: '' }
    const experimentalFile: File = { path: 'experimental.file', content: '' }
    const mainRef = PendingCommitRef.forBranch('branch-main')
    const experimentalRef = PendingCommitRef.forBranch('branch-experimental')

    beforeEach(async () => {
      const committing = git(Commit.toCommitRef(mainRef).withFiles([mainFile]))
      await git(Commit.toCommitRef(experimentalRef).withFiles([experimentalFile]))
      await committing
    })

    it('does not commit unexpected files', async () => {
      const mainCommit = (
        await repo.read('ls-tree', [mainRef.local.value, '-r', '--name-only'])
      ).split('\n')

      const experimentalCommit = (
        await repo.read('ls-tree', [experimentalRef.local.value, '-r', '--name-only'])
      ).split('\n')

      assertThat(mainCommit, equalTo([mainFile.path]))
      assertThat(experimentalCommit, equalTo([experimentalFile.path]))
    })
  })

  describe('@wip handling concurrent commits to the same repo', () => {
    const mainFile: File = { path: 'main.file', content: '' }
    const experimentalFile: File = { path: 'experimental.file', content: '' }
    const branchMain = 'branch-main'
    const branchExperimental = 'branch-experimental'
    const mainRef = PendingCommitRef.forBranch(branchMain)
    const experimentalRef = PendingCommitRef.forBranch(branchExperimental)
    const existingFile = { path: 'a.file', content: 'some content' }

    beforeEach(async () => {
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchMain),
          branchName: BranchName.of(branchMain),
          parent: RefName.fetchedFromOrigin(branchMain),
        })
          .withMessage('initial commit to main')
          .withFiles([existingFile]),
      )

      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchExperimental),
          branchName: BranchName.of(branchExperimental),
          parent: RefName.fetchedFromOrigin(branchExperimental),
        })
          .withMessage('initial commit to experiment')
          .withFiles([existingFile]),
      )

      const committing = git(Commit.toCommitRef(mainRef).withFiles([mainFile]))
      await git(Commit.toCommitRef(experimentalRef).withFiles([experimentalFile]))
      await committing
    })

    it('does not commit unexpected files', async () => {
      const mainCommit = (
        await repo.read('ls-tree', [mainRef.local.value, '-r', '--name-only'])
      ).split('\n')

      const experimentalCommit = (
        await repo.read('ls-tree', [experimentalRef.local.value, '-r', '--name-only'])
      ).split('\n')

      assertThat(mainCommit, containsInAnyOrder(existingFile.path, mainFile.path))
      assertThat(experimentalCommit, containsInAnyOrder(existingFile.path, experimentalFile.path))
    })
  })
})

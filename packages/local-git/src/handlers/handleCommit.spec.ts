import fs from 'fs'
import {
  Author,
  BranchName,
  CommitMessage,
  GitFile,
  PendingCommitRef,
  RefName,
  NameOfPerson,
  Email,
} from 'git-en-boite-core'
import { AsyncCommand, Dispatch, messageDispatch } from 'git-en-boite-message-dispatch'
import {
  assertThat,
  containsInAnyOrder,
  containsString,
  containsStrings,
  equalTo,
  not,
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
  const branchName = BranchName.of('a-branch')
  const initialCommitMessage = CommitMessage.of('initial commit')
  const commitMessage = CommitMessage.of('A commit message')

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

    await git(Commit.toCommitRef(localCommitRef).withMessage(commitMessage))
    assertThat(
      await repo.read('log', [localCommitRef.local.value, '--oneline']),
      containsString(commitMessage.value),
    )
  })

  it('creates a commit with the given author', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)

    await git(
      Commit.toCommitRef(localCommitRef).byAuthor(
        new Author(new NameOfPerson('Bob'), new Email('bob@smartbear.com')),
      ),
    )

    assertThat(
      await repo.read('log', [localCommitRef.local.value]),
      containsString('Bob <bob@smartbear.com>'),
    )
  })

  it('creates a commit containing the given files', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)
    const file = new GitFile('a.file', 'some content')
    await git(Commit.toCommitRef(localCommitRef).withFiles([file]))
    assertThat(
      await repo.read('ls-tree', [localCommitRef.local.value, '-r', '--name-only']),
      containsString(file.path),
    )
  })

  it('clears the index before committing the index with no parent', async () => {
    const localCommitRef = LocalCommitRef.forBranch(branchName)
    const file = new GitFile('a.file', 'some content')
    const objectId = await repo.read('hash-object', ['-w', '--stdin'], { stdin: 'Junk file' })
    await repo.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, 'junk.file'])
    await git(Commit.toCommitRef(localCommitRef).withFiles([file]))

    assertThat(
      await repo.read('ls-tree', [localCommitRef.local.value, '-r', '--name-only']),
      not(containsString('junk.file')),
    )
  })

  describe('to a local branch', () => {
    const commitRef = LocalCommitRef.forBranch(branchName)

    it('creates a commit with a parent', async () => {
      await git(Commit.toCommitRef(commitRef).withMessage(initialCommitMessage))
      await git(Commit.toCommitRef(commitRef).withMessage(commitMessage))
      assertThat(
        await repo.read('log', [commitRef.local.value, '--oneline']),
        containsStrings(initialCommitMessage.value, commitMessage.value),
      )
    })
  })

  describe('to a remote branch', () => {
    it('creates a commit using the existing tree', async () => {
      const existingFile = new GitFile('a.file', 'some content')
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchName),
          branchName,
          parent: RefName.fetchedFromOrigin(branchName),
        }).withFiles([existingFile]),
      )

      const otherFile = new GitFile('b.file', 'another content')
      const commitRef = PendingCommitRef.forBranch(branchName)
      await git(Commit.toCommitRef(commitRef).withFiles([otherFile]))

      assertThat(
        await repo.read('ls-tree', [commitRef.local.value, '-r', '--name-only']),
        containsStrings(existingFile.path, otherFile.path),
      )
    })

    it('creates a commit with a parent', async () => {
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchName),
          branchName,
          parent: RefName.fetchedFromOrigin(branchName),
        }).withMessage(initialCommitMessage),
      )
      const commitRef = PendingCommitRef.forBranch(branchName)
      await git(Commit.toCommitRef(commitRef).withMessage(commitMessage))
      assertThat(
        await repo.read('log', [commitRef.local.value, '--oneline']),
        containsStrings(initialCommitMessage.value, commitMessage.value),
      )
    })
  })

  describe('handling concurrent commits to the same repo', () => {
    const mainFile = new GitFile('main.file', '')
    const experimentalFile = new GitFile('experimental.file', '')
    const mainRef = PendingCommitRef.forBranch(BranchName.of('branch-main'))
    const experimentalRef = PendingCommitRef.forBranch(BranchName.of('branch-experimental'))

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

  describe('handling concurrent commits to the same repo', () => {
    const mainFile = new GitFile('main.file', '')
    const experimentalFile = new GitFile('experimental.file', '')
    const branchMain = BranchName.of('branch-main')
    const branchExperimental = BranchName.of('branch-experimental')
    const mainRef = PendingCommitRef.forBranch(branchMain)
    const experimentalRef = PendingCommitRef.forBranch(branchExperimental)
    const existingFile = new GitFile('a.file', 'some content')

    beforeEach(async () => {
      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchMain),
          branchName,
          parent: RefName.fetchedFromOrigin(branchMain),
        })
          .withMessage(commitMessage)
          .withFiles([existingFile]),
      )

      await git(
        Commit.toCommitRef({
          local: RefName.fetchedFromOrigin(branchExperimental),
          branchName,
          parent: RefName.fetchedFromOrigin(branchExperimental),
        })
          .withMessage(commitMessage)
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

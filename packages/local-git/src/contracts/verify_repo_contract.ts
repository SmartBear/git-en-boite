import {
  Author,
  BranchName,
  CommitMessage,
  GitRepo,
  OpenGitRepo,
  PendingCommitRef,
  RemoteUrl,
  CommitName,
} from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, matchesPattern } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { Commit, GetRefs, LocalCommitRef, RepoProtocol } from '..'
import { GitDirectory } from '../git_directory'

type OpenOriginRepo = (path: string) => Promise<Dispatch<RepoProtocol>>

export const verifyRepoContract = (
  openGitRepo: OpenGitRepo,
  createOriginRepo: OpenOriginRepo,
): void => {
  const branchName = BranchName.of('main')
  let root: string
  let repoPath: string
  let git: GitRepo

  beforeEach(async () => {
    root = dirSync().name
    repoPath = path.resolve(root, 'a-repo-id')
    git = await openGitRepo(repoPath)
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('fetching commits', () => {
    context('from an origin repo with commits on the main branch', () => {
      let latestCommit: CommitName
      let originUrl: RemoteUrl

      beforeEach(async () => {
        originUrl = RemoteUrl.of(path.resolve(root, 'remote', 'a-repo-id'))
        const origin = await createOriginRepo(originUrl.value)
        await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
        latestCommit = (await origin(GetRefs.all())).forBranch(branchName).revision
      })

      it('fetches commits from the origin repo', async () => {
        await git.setOriginTo(originUrl)
        await git.fetch()
        const refs = await git.getRefs()
        const ref = refs.find(ref => ref.isRemote)
        await assertThat(ref.revision, equalTo(latestCommit))
      })

      //     it('fails when the remote does not exist', async () => {
      //       const repoPath = path.resolve(root, 'a-repo-id')
      //       const git = await factory.open(repoPath)
      //       await git(SetOrigin.toUrl('invalid-remote-url'))
      //       await promiseThat(
      //         git(Fetch.fromOrigin()),
      //         isRejectedWith(
      //           hasProperty('message', matchesPattern('does not appear to be a git repository')),
      //         ),
      //       )
      //     })
    })
  })

  describe('committing', () => {
    it('commits a new file to a branch', async () => {
      const file = {
        path: 'a.feature',
        content: 'Feature: A',
      }
      const author = new Author('Bob', 'bob@example.com')
      const commitRef = LocalCommitRef.forBranch(branchName)
      const message = CommitMessage.of('a message')
      await git.commit(commitRef, [file], author, message)
      const backDoor = new GitDirectory(repoPath)
      const result = await backDoor.exec('ls-tree', [branchName.value, '--name-only'])
      assertThat(result.stdout, matchesPattern(file.path))
    })
  })

  describe('pushing', () => {
    let originUrl: RemoteUrl
    let origin: Dispatch<RepoProtocol>
    beforeEach(async () => {
      originUrl = RemoteUrl.of(path.resolve(root, 'remote', 'a-repo-id'))
      origin = await createOriginRepo(originUrl.value)
      const commitRef = LocalCommitRef.forBranch(branchName)
      await origin(Commit.toCommitRef(commitRef))
    })

    it('pushes a commit to a remote branch', async () => {
      await git.setOriginTo(originUrl)
      await git.fetch()
      const file = {
        path: 'a.feature',
        content: 'Feature: A',
      }
      const author = new Author('Bob', 'bob@example.com')
      const commitRef = PendingCommitRef.forBranch(branchName)
      const message = CommitMessage.of('a message')
      await git.commit(commitRef, [file], author, message)
      await git.push(commitRef)
      const { revision: commitName } = (await git.getRefs()).forBranch(branchName)
      const { revision: originCommitName } = (await origin(GetRefs.all())).forBranch(branchName)
      await assertThat(originCommitName, equalTo(commitName))
    })
  })

  // describe(GetRefs.name, () => {
  //   context('with an origin repo with commits on master', () => {
  //     let originUrl: string

  //     beforeEach(async () => {
  //       originUrl = path.resolve(root, 'remote', 'a-repo-id')
  //       const origin = await nonBareRepoFactory.open(originUrl)
  //       await origin(Commit)
  //     })

  //     context('and the repo has been fetched', () => {
  //       let git: Dispatch<Protocol>

  //       beforeEach(async () => {
  //         git = await factory.open(path.resolve(root, 'a-repo-id'))
  //         await git(SetOrigin.toUrl(originUrl))
  //         await git(Fetch.fromOrigin())
  //       })

  //       it('returns a Ref for the remote master branch', async () => {
  //         const refs = await git(GetRefs.all())
  //         assertThat(refs, hasItem(hasProperty('isRemote', truthy())))
  //         const ref = refs.find(ref => ref.isRemote)
  //         assertThat(ref.revision, matchesPattern(SHA1_PATTERN))
  //         assertThat(ref.isRemote, truthy())
  //         assertThat(ref.branchName, equalTo('master'))
  //       })
  //     })
  //   })
  // })
}

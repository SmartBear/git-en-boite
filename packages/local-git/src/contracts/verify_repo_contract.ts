import {
  AccessDenied,
  Author,
  BranchName,
  CommitMessage,
  CommitName,
  Email,
  FileContent,
  FilePath,
  GitFile,
  GitRepo,
  NameOfPerson,
  NotFound,
  OpenGitRepo,
  PendingCommitRef,
  RemoteUrl,
  RepoId,
} from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'
import {
  assertThat,
  equalTo,
  fulfilled,
  instanceOf,
  matchesPattern,
  promiseThat,
  rejected,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { Commit, GetRefs, LocalCommitRef, RepoProtocol } from '..'
import { GitDirectory } from '../git_directory'
import { runGitHttpServer } from '../test/run_git_http_server'

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

  describe('setting origin', () => {
    const originId = RepoId.of('origin')

    beforeEach(async () => {
      const origin = await createOriginRepo(path.resolve(root, originId.value))
      await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    })

    const remoteUrl = runGitHttpServer(() => root, {
      authenticate: ({ repo }: { repo: string }) =>
        new Promise((resolve, reject) =>
          repo.match(/private/) ? reject('Access denied') : resolve(),
        ),
    })

    it('succeeds for a valid remoteUrl', async () => {
      await promiseThat(git.setOriginTo(remoteUrl(originId)), fulfilled())
    })

    it("fails for a repo that doesn't exist", async () => {
      await promiseThat(
        git.setOriginTo(remoteUrl(RepoId.of('does-not-exist'))),
        rejected(instanceOf(NotFound)),
      )
    })

    it('fails for invalid credentials', async () => {
      await promiseThat(
        git.setOriginTo(remoteUrl(RepoId.of('private'))),
        rejected(instanceOf(AccessDenied)),
      )
    })
  })

  describe('fetching commits', () => {
    context('from an origin repo with commits on the main branch', () => {
      const repoId = RepoId.of('a-repo')
      let latestCommit: CommitName

      beforeEach(async () => {
        const origin = await createOriginRepo(path.resolve(root, repoId.value))
        await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
        latestCommit = (await origin(GetRefs.all())).forBranch(branchName).revision
      })

      const remoteUrl = runGitHttpServer(() => root, {
        authenticate: ({ repo }: { repo: string }) =>
          new Promise((resolve, reject) =>
            repo.match(/private/) ? reject('Access denied') : resolve(),
          ),
      })

      it('fetches commits from the origin repo', async () => {
        await git.setOriginTo(remoteUrl(repoId))
        await git.fetch()
        const refs = await git.getRefs()
        const ref = refs.find(ref => ref.isRemote)
        await assertThat(ref.revision, equalTo(latestCommit))
      })
    })
  })

  describe('committing', () => {
    it('commits a new file to a branch', async () => {
      const file = new GitFile(new FilePath('a.feature'), new FileContent('Feature: A'))
      const author = new Author(new NameOfPerson('Bob'), new Email('bob@example.com'))
      const commitRef = LocalCommitRef.forBranch(branchName)
      const message = CommitMessage.of('a message')
      await git.commit(commitRef, [file], author, message)
      const backDoor = new GitDirectory(repoPath)
      const result = await backDoor.exec('ls-tree', [branchName.value, '--name-only'])
      assertThat(result.stdout, matchesPattern(file.path.value))
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
      const file = new GitFile(new FilePath('a.feature'), new FileContent('Feature: A'))
      const author = new Author(new NameOfPerson('Bob'), new Email('bob@example.com'))
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

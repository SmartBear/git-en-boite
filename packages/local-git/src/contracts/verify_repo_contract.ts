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
import Server from 'node-git-server'
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

  describe('setting origin', () => {
    let originPath: string
    const gitPort = 4000
    const remoteUrl = (repoId: RepoId) => RemoteUrl.of(`http://localhost:${gitPort}/${repoId}`)

    beforeEach(async () => {
      originPath = path.resolve(root, 'origin')
      const origin = await createOriginRepo(originPath)
      await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let server: any
    beforeEach(async () => {
      server = new Server(root, {
        autoCreate: false,
        authenticate: ({ repo }: { repo: string }) =>
          new Promise((resolve, reject) =>
            repo.match(/private/) ? reject('Access denied') : resolve(),
          ),
      })
      await new Promise(started => server.listen(gitPort, started))
    })
    afterEach(async () => {
      await server.close().catch(() => {
        // ignore any error
      })
    })

    it('succeeds for a valid remoteUrl', async () => {
      await promiseThat(git.setOriginTo(remoteUrl(RepoId.of('origin'))), fulfilled())
    })
    it("fails for a repo that doesn't exist", async () => {
      await promiseThat(
        git.setOriginTo(remoteUrl(RepoId.of('does-not-exist'))),
        rejected(new Error('Not found')),
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
      let latestCommit: CommitName
      let originPath: string
      const gitPort = 4000
      const originUrl = RemoteUrl.of(`http://localhost:${gitPort}/origin`)

      beforeEach(async () => {
        originPath = path.resolve(root, 'origin')
        const origin = await createOriginRepo(originPath)
        await origin(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
        latestCommit = (await origin(GetRefs.all())).forBranch(branchName).revision
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let server: any
      beforeEach(async () => {
        server = new Server(root, {
          autoCreate: false,
          authenticate: ({ repo }: { repo: string }) =>
            new Promise((resolve, reject) =>
              repo.match(/private/) ? reject('Access denied') : resolve(),
            ),
        })
        await new Promise(started => server.listen(gitPort, started))
      })
      afterEach(async () => {
        await server.close().catch(() => {
          // ignore any error
        })
      })

      beforeEach(async () => {
        const origin = await createOriginRepo(originPath)
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

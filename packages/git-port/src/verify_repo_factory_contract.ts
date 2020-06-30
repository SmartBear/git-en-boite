import { OpenGitRepo } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { GetConfig, BareRepoProtocol, NonBareRepoProtocol, Commit, GetRevision } from '.'
import { Dispatch } from 'git-en-boite-message-dispatch'

const SHA1_PATTERN = /[0-9a-f]{5,40}/

type OpenOriginRepo = (path: string) => Promise<Dispatch<NonBareRepoProtocol>>
type OpenBareRepo = (path: string) => Promise<Dispatch<BareRepoProtocol>>

export const verifyRepoContract = (
  openGitRepo: OpenGitRepo,
  createOriginRepo: OpenOriginRepo,
): void => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('fetching commits', () => {
    context('from an origin repo with commits on the main branch', () => {
      let latestCommit: string
      let originUrl: string

      beforeEach(async () => {
        originUrl = path.resolve(root, 'remote', 'a-repo-id')
        const origin = await createOriginRepo(originUrl)
        await origin(Commit.withAnyMessage())
        latestCommit = await origin(GetRevision.forBranchNamed('master'))
      })

      it('fetches commits from the origin repo', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await openGitRepo(repoPath)
        await git.connect(originUrl)
        await git.fetch()
        const refs = await git.getRefs()
        const ref = refs.find(ref => ref.isRemote)
        await assertThat(ref.revision, equalTo(latestCommit))
      })
    })
  })
}

export const verifyRepoFactoryContract = (
  openGitRepo: OpenGitRepo,
  openBareRepo: OpenBareRepo,
): void => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe('opening a repo path', () => {
    context('when the directory does not exist', () => {
      it('creates an initialised repo', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        await openGitRepo(repoPath)
        const git = await openBareRepo(repoPath)
        const config = await git(GetConfig.forRepo())
        await assertThat(config['user.name'], equalTo('Git en boîte'))
      })
    })

    context('when there is already a repo in the directory', () => {
      it('opens the existing repo')
    })
  })

  // describe(Fetch.name, () => {
  //   context('with an origin repo with commits on master', () => {
  //     let latestCommit: string
  //     let originUrl: string

  //     beforeEach(async () => {
  //       originUrl = path.resolve(root, 'remote', 'a-repo-id')
  //       const origin = await nonBareRepoFactory.open(originUrl)
  //       await origin(Commit.withAnyMessage())
  //       latestCommit = await origin(GetRevision.forBranchNamed('master'))
  //     })

  //     it('fetches commits from the origin remote', async () => {
  //       const repoPath = path.resolve(root, 'a-repo-id')
  //       const git = await factory.open(repoPath)
  //       await git(SetOrigin.toUrl(originUrl))
  //       await git(Fetch.fromOrigin())
  //       const refs = await git(GetRefs.all())
  //       const ref = refs.find(ref => ref.isRemote)
  //       await assertThat(ref.revision, equalTo(latestCommit))
  //     })

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
  //   })
  // })

  // describe(GetRefs.name, () => {
  //   context('with an origin repo with commits on master', () => {
  //     let originUrl: string

  //     beforeEach(async () => {
  //       originUrl = path.resolve(root, 'remote', 'a-repo-id')
  //       const origin = await nonBareRepoFactory.open(originUrl)
  //       await origin(Commit.withAnyMessage())
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

import { Dispatch, ValidProtocol } from 'git-en-boite-command-bus'
import {
  Commit,
  Connect,
  Fetch,
  GetRefs,
  GetRevision,
  GitRepoProtocol,
  Init,
  OpensGitRepos,
  SetOrigin,
} from 'git-en-boite-git-port'
import {
  assertThat,
  equalTo,
  fulfilled,
  hasProperty,
  isRejectedWith,
  matchesPattern,
  promiseThat,
  truthy,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { TestableGitRepoFactory } from '.'
import { GitRepoFactory } from './git_repo_factory'
import { TestableGitRepoProtocol } from './testable_git_repo_factory'

const verifyGitRepoFactoryContract = <
  Protocol extends ValidProtocol<Protocol> & (GitRepoProtocol | TestableGitRepoProtocol)
>(
  factory: OpensGitRepos<Protocol>,
) => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  describe(Fetch.name, () => {
    context('with an origin repo with commits on master', () => {
      let latestCommit: string
      let originUrl: string

      beforeEach(async () => {
        originUrl = path.resolve(root, 'remote', 'a-repo-id')
        const origin = await new TestableGitRepoFactory().open(originUrl)
        await origin(Init.normalRepo())
        await origin(Commit.withAnyMessage())
        latestCommit = await origin(GetRevision.forBranchNamed('master'))
      })

      it('fetches commits from the origin remote', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await factory.open(repoPath)
        await git(Init.bareRepo())
        await git(SetOrigin.toUrl(originUrl))
        await git(Fetch.fromOrigin())
        const refs = await git(GetRefs.all())
        await assertThat(refs[0].revision, equalTo(latestCommit))
      })

      it('fails when the remote does not exist', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await factory.open(repoPath)
        await git(Init.bareRepo())
        await git(SetOrigin.toUrl('invalid-remote-url'))
        await promiseThat(
          git(Fetch.fromOrigin()),
          isRejectedWith(
            hasProperty('message', matchesPattern('does not appear to be a git repository')),
          ),
        )
      })
    })
  })

  describe(GetRefs.name, () => {
    context('with an origin repo with commits on master', () => {
      let originUrl: string

      beforeEach(async () => {
        originUrl = path.resolve(root, 'remote', 'a-repo-id')
        const origin = await new TestableGitRepoFactory().open(originUrl)
        await origin(Init.normalRepo())
        await origin(Commit.withAnyMessage())
      })

      context('and the repo has been fetched', () => {
        let git: Dispatch<Protocol>

        beforeEach(async () => {
          git = await new GitRepoFactory().open(path.resolve(root, 'a-repo-id'))
          await git(Init.bareRepo())
          await git(SetOrigin.toUrl(originUrl))
          await git(Fetch.fromOrigin())
        })

        it('returns a single Ref for the remote master branch', async () => {
          const SHA1_PATTERN = /[0-9a-f]{5,40}/
          const refs = await git(GetRefs.all())
          assertThat(refs, hasProperty('length', equalTo(1)))
          assertThat(refs[0].revision, matchesPattern(SHA1_PATTERN))
          assertThat(refs[0].isRemote, truthy())
          assertThat(refs[0].branchName, equalTo('master'))
        })
      })
    })
  })
}

describe(GitRepoFactory.name, () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  const factory = new GitRepoFactory()
  verifyGitRepoFactoryContract(factory)

  describe(Connect.name, () => {
    let remoteUrl: string
    let origin: Dispatch<TestableGitRepoProtocol>

    beforeEach(async () => {
      remoteUrl = path.resolve(root, 'remote', 'a-repo-id')
      origin = await new TestableGitRepoFactory().open(remoteUrl)
      await origin(Init.normalRepo())
      await origin(Commit.withAnyMessage())
    })

    it('creates a new repo', async () => {
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = await factory.open(repoPath)
      await git(Connect.toUrl(remoteUrl))
      await promiseThat(git(GetRefs.all()), fulfilled())
    })
  })
})

describe(TestableGitRepoFactory.name, () => {
  verifyGitRepoFactoryContract(new TestableGitRepoFactory())
})

import { GitRepo, OpenGitRepo } from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, matchesPattern } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { BareRepoProtocol, Commit, GetRevision } from '..'
import { GitDirectory } from '../git_directory'

type OpenOriginRepo = (path: string) => Promise<Dispatch<BareRepoProtocol>>

export const verifyRepoContract = (
  openGitRepo: OpenGitRepo,
  createOriginRepo: OpenOriginRepo,
): void => {
  const branchName = 'main'
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
      let latestCommit: string
      let originUrl: string

      beforeEach(async () => {
        originUrl = path.resolve(root, 'remote', 'a-repo-id')
        const origin = await createOriginRepo(originUrl)
        await origin(Commit.withAnyMessage().toBranch(branchName))
        latestCommit = await origin(GetRevision.forBranchNamed(branchName))
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
      await git.commit(branchName, file)
      const backDoor = new GitDirectory(repoPath)
      const result = await backDoor.execGit('ls-tree', [branchName, '--name-only'])
      assertThat(result.stdout, matchesPattern(file.path))
    })
  })

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

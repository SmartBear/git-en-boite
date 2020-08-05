import { OpenGitRepo } from 'git-en-boite-core'
import { Dispatch } from 'git-en-boite-message-dispatch'
import { assertThat, equalTo, matchesPattern } from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'

import { Commit, GetRevision, NonBareRepoProtocol } from '..'
import { GitDirectory } from '../git_directory'

type OpenOriginRepo = (path: string) => Promise<Dispatch<NonBareRepoProtocol>>

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
        await git.setOriginTo(originUrl)
        await git.fetch()
        const refs = await git.getRefs()
        const ref = refs.find(ref => ref.isRemote)
        await assertThat(ref.revision, equalTo(latestCommit))
      })
    })
  })

  describe.skip('@wip committing', () => {
    it('commits a new file to a branch', async () => {
      const branchName = 'main'
      const file = {
        path: 'a.feature',
        content: 'Feature: A',
      }
      const repoPath = path.resolve(root, 'a-repo-id')
      const git = await openGitRepo(repoPath)
      await git.commit(branchName, file)
      const backDoor = new GitDirectory(repoPath)
      const result = await backDoor.execGit('ls-tree', [branchName, '--name-only'])
      assertThat(result.stdout, matchesPattern(file.path))
    })
  })
}

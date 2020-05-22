import childProcess from 'child_process'
import { Commit, Fetch, GetRevision, Init, SetOrigin } from 'git-en-boite-core-port-git'
import {
  fulfilled,
  hasProperty,
  isRejectedWith,
  matchesPattern,
  promiseThat,
  startsWith,
} from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { GitDirectory } from './git_directory'
import { GitRepoFactory, TestableGitRepoFactory } from './index'

const exec = promisify(childProcess.exec)
describe(GitDirectory.name, () => {
  const root = path.resolve(__dirname, '../tmp')

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  describe('executing a GitOperation', () => {
    describe(Init.name, () => {
      it('creates a new bare repo with conservative garbage collection settings', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await new GitRepoFactory().open(repoPath)
        await git(Init.bareRepo())
        await promiseThat(
          exec('git config --get core.bare', { cwd: repoPath }),
          fulfilled(hasProperty('stdout', startsWith('true'))),
        )
        await promiseThat(
          exec('git config --get gc.auto', { cwd: repoPath }),
          fulfilled(hasProperty('stdout', startsWith('0'))),
        )
        await promiseThat(
          exec('git config --get gc.pruneExpire', { cwd: repoPath }),
          fulfilled(hasProperty('stdout', startsWith('never'))),
        )
      })
    })

    describe(SetOrigin.name, () => {
      it('creates a remote called origin pointing to the URL', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await new GitRepoFactory().open(repoPath)
        const repoUrl = 'git@host/repo'
        await git(Init.bareRepo())
        await git(SetOrigin.toUrl(repoUrl))
        await promiseThat(
          exec('git remote get-url origin', { cwd: repoPath }),
          fulfilled(hasProperty('stdout', startsWith(repoUrl))),
        )
      })
    })

    describe(Fetch.name, () => {
      context('an origin repo with commits on master', () => {
        let latestCommit: string
        let originUrl: string

        beforeEach(async () => {
          originUrl = path.resolve(root, 'remote', 'a-repo-id')
          const origin = await new TestableGitRepoFactory().open(originUrl)
          await origin(Init.normalRepo())
          await origin(Commit.withAnyMessage())
          latestCommit = await origin(GetRevision.forCurrentBranch())
        })

        it('fetches commits from the origin remote', async () => {
          const repoPath = path.resolve(root, 'a-repo-id')
          const git = await new GitRepoFactory().open(repoPath)
          await git(Init.bareRepo())
          await git(SetOrigin.toUrl(originUrl))
          await git(Fetch.fromOrigin())
          await promiseThat(
            exec('git rev-parse refs/remotes/origin/master', { cwd: repoPath }),
            fulfilled(hasProperty('stdout', startsWith(latestCommit))),
          )
        })

        it('fails when the remote does not exist', async () => {
          const repoPath = path.resolve(root, 'a-repo-id')
          const git = await new GitRepoFactory().open(repoPath)
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
  })
})

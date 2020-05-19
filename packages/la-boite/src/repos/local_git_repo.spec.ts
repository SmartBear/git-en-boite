import childProcess from 'child_process'
import { Init, SetOrigin, Commit, GetRevision, Fetch } from 'git-en-boite-core-port-git'
import {
  assertThat,
  containsInAnyOrder,
  fulfilled,
  hasProperty,
  matchesPattern,
  promiseThat,
  rejected,
  startsWith,
  isRejectedWith,
} from 'hamjest'
import path from 'path'
import { promisify } from 'util'

import { LocalGitRepo } from './local_git_repo'

const exec = promisify(childProcess.exec)
describe(LocalGitRepo.name, () => {
  const root = path.resolve(__dirname, '../../tmp')

  beforeEach(async () => {
    await exec(`rm -rf ${root}`)
  })

  describe('executing a GitOperation', () => {
    describe(Init.name, () => {
      it('creates a new bare repo with conservative garbage collection settings', async () => {
        const repoPath = path.resolve(root, 'a-repo-id')
        const git = await LocalGitRepo.openForCommands(repoPath)
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
        const git = await LocalGitRepo.openForCommands(repoPath)
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
          const origin = await LocalGitRepo.openForCommands(originUrl)
          await origin(Init.normalRepo())
          await origin(Commit.withAnyMessage())
          latestCommit = await origin(GetRevision.forCurrentBranch())
        })

        it('fetches commits from the origin remote', async () => {
          const repoPath = path.resolve(root, 'a-repo-id')
          const git = await LocalGitRepo.openForCommands(repoPath)
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
          const git = await LocalGitRepo.openForCommands(repoPath)
          await git(Init.bareRepo())
          await git(SetOrigin.toUrl('invalid-remote-url'))
          await promiseThat(
            git(Fetch.fromOrigin()),
            isRejectedWith(hasProperty('message', matchesPattern('Unable to fetch'))),
          )
        })
      })
    })
  })

  describe('running arbitrary git commands', () => {
    it('returns a promise of the result', async () => {
      const repoId = 'a-new-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      const result = await repo.execGit('init')
      assertThat(result.stdout, startsWith('Initialized empty Git repository'))
    })

    it('raises any error', async () => {
      const repoId = 'a-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      await promiseThat(
        repo.execGit('not-a-command'),
        rejected(hasProperty('message', matchesPattern('is not a git command'))),
      )
    })
  })

  describe('listing refs', () => {
    it('lists the branches in the repo', async () => {
      const repoId = 'a-repo-id'
      const repoPath = path.resolve(root, repoId)
      const repo = await LocalGitRepo.open(repoPath)
      await repo.execGit('init')
      await repo.execGit('config', 'user.email', 'test@example.com')
      await repo.execGit('config', 'user.name', 'Test User')
      const branches = ['one', 'two']
      for (const branchName of branches) {
        await repo.execGit('checkout', '-b', branchName)
        await repo.execGit('commit', '--allow-empty', '-m "test"')
      }
      const refs = await repo.refs()
      assertThat(
        refs.map(ref => ref.name),
        containsInAnyOrder('refs/heads/one', 'refs/heads/two'),
      )
      for (const ref of refs) {
        assertThat(ref, hasProperty('revision', matchesPattern('[a-e][0-9]')))
      }
    })
  })
})

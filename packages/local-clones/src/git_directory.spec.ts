import fs from 'fs'
import { AccessDenied, RepoId } from 'git-en-boite-core'
import {
  assertThat,
  containsString,
  equalTo,
  hasProperty,
  instanceOf,
  matchesPattern,
  promiseThat,
  rejected,
  startsWith,
} from 'hamjest'
import path from 'path'
import { dirSync } from 'tmp'
import { eventually } from 'ts-eventually'

import { GitDirectory } from './git_directory'
import { runGitHttpServer } from './test/run_git_http_server'

describe(GitDirectory.name, () => {
  let root: string

  beforeEach(() => (root = dirSync().name))
  afterEach(function () {
    if (this.currentTest.state === 'failed' && this.currentTest.err)
      this.currentTest.err.message = `\nFailed using tmp directory:\n${root}\n${this.currentTest.err?.message}`
  })

  let repoPath: string
  beforeEach(() => {
    repoPath = path.resolve(root, 'a-repo')
    fs.mkdirSync(repoPath, { recursive: true })
  })

  describe('executing git commands', () => {
    it('returns a promise of the result', async () => {
      const repo = new GitDirectory(repoPath)
      const result = await repo.exec('init')
      assertThat(result.stdout, startsWith('Initialized empty Git repository'))
    })

    it('raises any error', async () => {
      const repo = new GitDirectory(repoPath)
      await promiseThat(
        repo.exec('not-a-command'),
        rejected(hasProperty('message', matchesPattern('is not a git command')))
      )
    })

    context('for a private repo', () => {
      const remoteUrl = runGitHttpServer(() => root, {
        authenticate: ({ repo }) =>
          new Promise<void>((resolve, reject) => (repo.match(/private/) ? reject('Access denied') : resolve())),
      })

      it('never normally asks for a prompt', async () => {
        const repo = new GitDirectory(repoPath)
        await promiseThat(
          repo.exec('ls-remote', [remoteUrl(RepoId.of('a-private-repo')).value]),
          rejected(instanceOf(AccessDenied))
        )
      })

      it('is not possible to ask for terminal prompt, even if you try', async () => {
        const repo = new GitDirectory(repoPath)
        await promiseThat(
          repo.exec('ls-remote', [remoteUrl(RepoId.of('a-private-repo')).value], {
            env: { GIT_TERMINAL_PROMPT: 1 },
          }),
          rejected()
        )
      })
    })

    describe('options', () => {
      it('passes options', async () => {
        const repo = new GitDirectory(repoPath)
        await repo.exec('init')
        await repo.exec('config', ['--local', 'user.email', 'you@example.com'])
        await repo.exec('config', ['--local', 'user.name', 'Your name'])
        await repo.exec('commit', ['--allow-empty', '-m', 'A commit'], {
          env: { GIT_REFLOG_ACTION: 'testing' },
        })
        assertThat(await repo.read('reflog', ['-1']), containsString('testing: A commit'))
      })

      it('uses options from the constructor', async () => {
        const repo = new GitDirectory(repoPath, {
          env: { GIT_REFLOG_ACTION: 'testing' },
        })
        await repo.exec('init')
        await repo.exec('config', ['--local', 'user.email', 'you@example.com'])
        await repo.exec('config', ['--local', 'user.name', 'Your name'])
        await repo.exec('commit', ['--allow-empty', '-m', 'A commit'])
        assertThat(await repo.read('reflog', ['-1']), containsString('testing: A commit'))
      })

      it('overrides options from the constructor', async () => {
        const repo = new GitDirectory(repoPath, {
          env: { GIT_REFLOG_ACTION: 'testing' },
        })
        await repo.exec('init')
        await repo.exec('config', ['--local', 'user.email', 'you@example.com'])
        await repo.exec('config', ['--local', 'user.name', 'Your name'])
        await repo.exec('commit', ['--allow-empty', '-m', 'A commit'], {
          env: { GIT_REFLOG_ACTION: 'amazing' },
        })
        assertThat(await repo.read('reflog', ['-1']), containsString('amazing: A commit'))
      })
    })
  })

  describe('using a temporary index', () => {
    it('operates on that index only', async () => {
      const repo = new GitDirectory(repoPath)
      await repo.exec('init')
      const objectId = await repo.read('hash-object', ['-w', '--stdin'], {
        stdin: 'My file content',
      })
      await repo.withUniqueIndex(async (repoWithIndex) => {
        const file = 'a-file'
        await repoWithIndex.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, file])
        assertThat((await repoWithIndex.read('ls-files')).split('\n'), equalTo([file]))
      })
      await repo.withUniqueIndex(async (repoWithIndex) => {
        const file = 'another-file'
        await repoWithIndex.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, file])
        assertThat((await repoWithIndex.read('ls-files')).split('\n'), equalTo([file]))
      })
      assertThat((await repo.read('ls-files')).split('\n'), equalTo(['']))
    })

    it('returns the result of the block', async () => {
      const repo = new GitDirectory(repoPath)
      const result = await repo.withUniqueIndex(async () => new Promise((resolve) => resolve(5)))
      assertThat(result, equalTo(5))
    })

    it('cleans up the index, but only once the operation is done', async () => {
      const repo = new GitDirectory(repoPath)
      await repo.exec('init')
      const objectId = await repo.read('hash-object', ['-w', '--stdin'], {
        stdin: 'My file content',
      })
      const file = 'a-file'
      let done: (value?: unknown) => void
      const untilDone = new Promise((_done) => (done = _done))
      let repoWithIndex: GitDirectory
      const writingAFile = repo.withUniqueIndex(async (_repoWithIndex) => {
        repoWithIndex = _repoWithIndex
        await repoWithIndex.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, file])
        await untilDone
      })
      await eventually(async () => {
        assertThat((await repoWithIndex.read('ls-files')).split('\n'), equalTo([file]))
      })
      done()
      await writingAFile
      await assertThat((await repoWithIndex.read('ls-files')).split('\n'), equalTo(['']))
    })
  })
})

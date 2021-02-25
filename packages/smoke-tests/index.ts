import fs from 'fs'
import {
  Author,
  BranchName,
  CommitName,
  Email,
  Files,
  NameOfPerson,
  RepoId,
} from 'git-en-boite-core'
import { GitDirectory } from 'git-en-boite-local-clones'
import { assertThat, equalTo } from 'hamjest'
import { nanoid } from 'nanoid'
import fetch, { Response } from 'node-fetch'
import os from 'os'
import path from 'path'
import supertest from 'supertest'
import waitOn from 'wait-on'

const url = process.env.smoke_tests_web_server_url
const remoteUrl = process.env.smoke_tests_remote_repo_url
const deliberateError = process.env.smoke_tests_deliberate_error

if (!url) throw new Error('Please define smoke_tests_web_server_url env var')
if (!remoteUrl) throw new Error('Please define smoke_tests_remote_repo_url env var')

const TIMEOUT = 20000

describe(`Smoke tests on ${url}`, function () {
  this.timeout(TIMEOUT)

  const repoId = RepoId.of(`smoke-test-${nanoid(8)}`)
  const localRepoPath = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`)
  const localRepo = new GitDirectory(localRepoPath)
  const branchName = BranchName.of(`smoke-tests-${nanoid(8)}`)

  before(async () => {
    await localRepo.exec('init')
    await localRepo.exec('remote', ['add', 'origin', remoteUrl])
  })

  after(async () => {
    try {
      const remoteRefs = (await localRepo.exec('ls-remote', ['origin', `refs/heads/${branchName}`]))
        .stdout
      if (remoteRefs === '') return
    } catch (error) {
      console.warn(
        `Unable to even run \`ls-remote\` on the remote origin repo. Is the smoke_tests_remote_repo_url setting valid?\n\n${error}`,
      )
      return
    }
    await localRepo.exec('push', ['origin', '--delete', branchName.toString()])
  })

  before(() => {
    if (!deliberateError) return
    throw new Error(`Deliberate error: ${deliberateError}`)
  })

  it(`Checks if the server is up: ${url}`, async () => {
    await waitOn({ resources: [url], timeout: TIMEOUT * 0.5 })
    const response = await fetch(url)
    await assertOk(response)
  })

  it('Connects a repo', async () => {
    const response = await fetch(`${url}/repos/${repoId}`, {
      method: 'PUT',
      body: JSON.stringify({ remoteUrl }),
      headers: { 'Content-Type': 'application/json' },
    })
    await assertOk(response)
  })

  it('Waits for repo to be fetched', async () => {
    const response = await fetch(`${url}/repos/${repoId}/events?until=repo.fetched`)
    await assertOk(response)
  })

  it('Gets repo branches details', async () => {
    const response = await fetch(`${url}/repos/${repoId}`)
    assertThat((await response.json()).branches, equalTo([]))
  })

  it('Commits a file', async () => {
    const files = Files.fromJSON([{ path: 'path', content: 'content' }])
    const author = new Author(new NameOfPerson('Bob'), new Email('bob@example.com'))
    const message = CommitName.of('a message')

    const request = supertest(url)

    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author, message })
      .expect(200)
  })
})

const assertOk = async (response: Response) => {
  if (response.status === 200) return
  throw new Error(`Response (${response.status}) was not OK: "${await response.text()}"`)
}

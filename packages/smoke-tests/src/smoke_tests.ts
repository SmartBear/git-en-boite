import { spawn } from 'child_process'
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
import fetch from 'node-fetch'
import os from 'os'
import path from 'path'
import supertest from 'supertest'

const url = process.env.smoke_tests_web_server_url
const remoteUrl = process.env.smoke_tests_remote_repo_url

if (!url) throw new Error('Please define smoke_tests_web_server_url env var')
if (!remoteUrl) throw new Error('Please define smoke_tests_remote_repo_url env var')

describe('smoke test', function () {
  this.timeout(20000)

  const repoId = RepoId.of(`smoke-test-${nanoid(8)}`)
  const localRepoPath = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`)
  const localRepo = new GitDirectory(localRepoPath)
  const branchName = BranchName.of(`smoke-tests-${nanoid(8)}`)

  before(async () => {
    await localRepo.exec('init')
    await localRepo.exec('remote', ['add', 'origin', remoteUrl])
  })

  after(async () => {
    const remoteRefs = (await localRepo.exec('ls-remote', ['origin', `refs/heads/${branchName}`]))
      .stdout
    if (remoteRefs === '') return
    await localRepo.exec('push', ['origin', '--delete', branchName.toString()])
  })

  it(`Checks if the server is up: ${url}`, async () => {
    const response = await fetch(url)
    assertThat(response.status, equalTo(200))
  })

  it('Creates a repo', async () => {
    const params = { repoId: repoId, remoteUrl: remoteUrl }
    const response = await fetch(`${url}/repos`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    })
    assertThat(response.status, equalTo(202))
  })

  it('Waits for repo to be fetched', async () => {
    const response = await fetch(`${url}/repos/${repoId}/events?until=repo.fetched`)
    assertThat(response.status, equalTo(200))
  })

  it('Gets repo branches details', async () => {
    const response = await fetch(`${url}/repos/${repoId}`)
    assertThat((await response.json()).branches, equalTo([]))
  })

  it('Commits a file', async () => {
    const files = Files.fromJSON([{ path: 'path', content: 'content' }])
    const author = new Author(new NameOfPerson('Bob'), new Email('bob@example.com'))
    const message = CommitName.of('a message')

    let request = supertest(url)

    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author, message })
      .expect(200)
  })
})

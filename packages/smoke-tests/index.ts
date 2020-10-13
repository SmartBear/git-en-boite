import { assertThat, equalTo } from 'hamjest'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'
import { default as supertest} from 'supertest'
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
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('smoke test', function(){
  this.timeout(10000)

  let url = `http://localhost:3001`
  const repoId = RepoId.of(`smoke-test-${uuid()}`)

  let remote_url='https://cbohiptest:18e4bd8544d794df8e7c13cc841df2e9c1f1a7d2@github.com/smartbear/git-en-boite-demo.git'

  const localRepoPath = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`)
  const localRepo = new GitDirectory(localRepoPath)

  before(async ()=>{
    await localRepo.exec("init")
    await localRepo.exec("remote", ["add", "origin", remote_url])
    await cleanUpRemoteRepo()
  })

  after(cleanUpRemoteRepo)

  async function cleanUpRemoteRepo(){
    if ((await localRepo.exec("ls-remote", ["origin", "refs/heads/nouvelle-branche"])).stdout !== "")
      await localRepo.exec("push", ["origin", "--delete", "nouvelle-branche"])
  }

  it(`Checks if the server is up: ${url}`, async () => {
    const response = await fetch(url)
    assertThat(response.status, equalTo(200))
  })

  it('Creates a repo', async() => {
    const params = {'repoId': repoId, 'remoteUrl': remote_url};
    const response = await fetch(`${url}/repos`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {'Content-Type':'application/json'}
      }
    )
    assertThat(response.status, equalTo(202))
  })

  it('Waits for repo to be fetched', async() => {
    const response = await fetch(`${url}/repos/${repoId}/events?until=repo.fetched`)
    assertThat(response.status, equalTo(200))
  })

  it('Gets repo branches details', async() => {
    const response = await fetch(`${url}/repos/${repoId}`)
    assertThat((await response.json()).branches, equalTo([]))
  })

  it('Commits a file', async() => {
    const branchName = BranchName.of('nouvelle-branche')
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

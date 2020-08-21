import { Application, Author, BranchName, CommitMessage, GitFile, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../../../create_web_app'
import router from '../../../router'

describe('POST /repos/:repoId/branches/:branchName/commits', () => {
  let request: SuperTest<Test>
  let server: Server
  let app: StubbedInstance<Application>

  beforeEach(() => {
    app = stubInterface<Application>()
  })

  beforeEach(() => {
    const webApp = createWebApp(router(app))
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  it('accepts a valid payload with files and author', async () => {
    const repoId = RepoId.of('repo-id')
    const branchName = BranchName.of('a-branch')
    const file = new GitFile('a.file', 'some content')
    const files = [file]
    const author = new Author('Bob', 'bob@example.com')
    const message = CommitMessage.of('a message')
    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author, message })
      .expect(200)
    assertThat(app.commit, wasCalledWith(repoId, branchName, files, author, message))
  })

  it('responds with 400 if the payload has missing params', async () => {
    const repoId = RepoId.of('repo-id')
    const branchName = BranchName.of('a-branch')
    const response = await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({})
      .expect(400)
    assertThat(response.body.error, equalTo('Missing information from the request: files, author'))
  })

  it('responds with status 400 when files can not be deserialized', async () => {
    const repoId = RepoId.of('repo-id')
    const branchName = BranchName.of('a-branch')
    const files = ['file']
    const author = new Author('Bob', 'bob@example.com')
    const message = CommitMessage.of('a message')
    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author, message })
      .expect(400)
  })
})

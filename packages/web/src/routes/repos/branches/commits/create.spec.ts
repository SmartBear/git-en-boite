import {
  Application,
  Author,
  BranchName,
  CommitMessage,
  Email,
  Files,
  Logger,
  NameOfPerson,
  RepoId,
} from 'git-en-boite-core'
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
  const branchName = BranchName.of('a-branch')
  const repoId = RepoId.of('repo-id')

  beforeEach(() => {
    app = stubInterface<Application>()
  })

  beforeEach(() => {
    const webApp = createWebApp(router(app), Logger.none)
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  it('accepts a valid payload', async () => {
    const files = Files.fromJSON([{ path: 'path', content: 'content' }])
    const author = new Author(new NameOfPerson('Bob'), new Email('bob@example.com'))
    const message = CommitMessage.of('a message')
    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({
        files,
        author,
        message,
      })
      .expect(200)
    assertThat(app.commit, wasCalledWith(repoId, branchName, files, author, message))
  })

  it('responds with 400 if the payload has missing params', async () => {
    const response = await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({})
      .expect(400)
    assertThat(
      response.text,
      equalTo(
        "payload should have required property 'files', payload should have required property 'author', payload should have required property 'message'",
      ),
    )
  })

  it('responds with status 400 body parameters are malformed', async () => {
    const files = ['file']
    const author = { email: 'bob@example.com' }
    const message: [] = []
    const response = await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author, message })
      .expect(400)

    assertThat(
      response.text,
      equalTo(
        "payload/files/0 should be object, payload/author should have required property 'name', payload/message should be string",
      ),
    )
  })
})

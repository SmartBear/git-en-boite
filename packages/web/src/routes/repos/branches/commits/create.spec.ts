import { Application, Author, File, BranchName, RepoId } from 'git-en-boite-core'
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
    const webApp = createWebApp().use(router(app).routes()).use(router(app).allowedMethods())
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  it('accepts a valid payload with files and author', async () => {
    const repoId = RepoId.of('repo-id')
    const branchName = BranchName.of('a-branch')
    const file: File = { path: 'a.file', content: 'content' }
    const files = [file]
    const author = new Author('Bob', 'bob@example.com')
    await request
      .post(`/repos/${repoId}/branches/${branchName}/commits`)
      .send({ files, author })
      .expect(200)
    assertThat(app.commit, wasCalledWith(repoId, branchName, files, author))
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
})

import { Application } from 'git-en-boite-core'
import { assertThat, containsString, equalTo } from 'hamjest'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../create_web_app'
import router from '../router'

describe('POST /repos', () => {
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

  describe('validation', () => {
    it('responds with 400 (invalid request) when the request body is missing required content', async () => {
      const connectRepoRequest = {}
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(
        response.body.error,
        equalTo('Missing information from the request: repoId, remoteUrl'),
      )
    })

    it('responds with 400 (invalid request) when repoId is not valid', async () => {
      const connectRepoRequest = { repoId: 'a/repo/id', remoteUrl: '../tmp' }
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(response.body.error.repoId.msg, containsString('should match pattern'))
    })
  })
})

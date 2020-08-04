import { Application, FetchRepoRequest, QueryResult, GitRepoInfo } from 'git-en-boite-client-port'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import { InvalidRepoIdError } from '../intercept_request'
import createWebApp from '../create_web_app'
import router from './router'

describe('/repos', () => {
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

  const bareObject = <T>(object: T): Record<string, unknown> => JSON.parse(JSON.stringify(object))

  describe('GET /repos/:repoId', () => {
    it('returns an object with info about the repo', async () => {
      const repoInfo: GitRepoInfo = {
        repoId: 'a-repo-id',
        branches: [],
      }
      app.getInfo.resolves(QueryResult.from(repoInfo))
      const response = await request.get('/repos/a-repo-id').expect(200)
      assertThat(response.body, equalTo(bareObject(repoInfo)))
    })

    it("responds 404 if the repo doesn't exist", async () => {
      app.getInfo.resolves(QueryResult.from())
      await request.get('/repos/a-repo-id').expect(404)
    })
  })

  describe('POST /repos/', () => {
    it('connects to the remote repo', async () => {
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      app.getInfo.resolves(QueryResult.from())
      app.connectToRemote.withArgs(connectRepoRequest).resolves()
      await request.post('/repos').send(connectRepoRequest).expect(202)
      assertThat(app.connectToRemote.called, equalTo(true))
    })

    it('redirects to the repo if it already exists', async () => {
      const repoInfo: GitRepoInfo = {
        repoId: 'a-repo-id',
        branches: [],
      }
      app.getInfo.resolves(QueryResult.from(repoInfo))
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      await request.post('/repos').send(connectRepoRequest).expect(302)
      const response = await request.post('/repos').send(connectRepoRequest).redirects(1)
      assertThat(response.body, equalTo(bareObject(repoInfo)))
    })

    it('responds with 400 if the connection attempt fails', async () => {
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: 'a-bad-url' }
      app.getInfo.resolves(QueryResult.from())
      app.connectToRemote.withArgs(connectRepoRequest).rejects()
      await request.post('/repos').send(connectRepoRequest).expect(400)
    })

    it('responds with a message when request body is missing required content', async () => {
      const connectRepoRequest = {}
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(
        response.body.error,
        equalTo('Missing information from the request: repoId, remoteUrl'),
      )
    })

    it('responds with a message when repoId is not valid', async () => {
      const connectRepoRequest = { repoId: 'a/repo/id', remoteUrl: '../tmp' }
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(response.body.error, equalTo(InvalidRepoIdError.message))
    })
  })

  describe('POST /repos/:repoId', () => {
    it('triggers a fetch for the repo', async () => {
      const fetchRepoRequest: FetchRepoRequest = { repoId: 'a-repo-id' }
      app.fetchFromRemote.withArgs(fetchRepoRequest).resolves()
      await request.post('/repos/a-repo-id').expect(202)
      assertThat(app.fetchFromRemote.called, equalTo(true))
    })
  })

  describe('POST /repos/:repoId/branches/:branchName/commits', () => {
    it.only('reponds with 200', async () => {
      await request.post('/repos/:repoId/branches/:branchName/commits').expect(200)
    })
  })
})

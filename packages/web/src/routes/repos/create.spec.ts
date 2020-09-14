import { Application, RepoSnapshot, QueryResult, RemoteUrl, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, containsString } from 'hamjest'
import { wasCalled } from 'hamjest-sinon'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../create_web_app'
import router from '../router'

const bareObject = <T>(object: T): Record<string, unknown> => JSON.parse(JSON.stringify(object))

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

  it('connects to the remote repo', async () => {
    const repoId = RepoId.of('a-repo-id')
    const remoteUrl = RemoteUrl.of('../tmp')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(repoId, remoteUrl).resolves()
    await request.post('/repos').send({ repoId: repoId.value, remoteUrl }).expect(202)
    assertThat(app.connectToRemote, wasCalled())
  })

  it('redirects to the repo if it already exists', async () => {
    const repoId = RepoId.of('a-repo-id/with-slashes')
    const repoInfo = new RepoSnapshot(repoId, [])
    app.getInfo.resolves(QueryResult.from(repoInfo))
    const connectRepoRequest = { repoId, remoteUrl: '../tmp' }
    await request.post('/repos').send(connectRepoRequest).expect(302)
    const response = await request.post('/repos').send(connectRepoRequest).redirects(1)
    assertThat(response.body, equalTo(bareObject(repoInfo)))
  })

  it('responds with 400 if the connection attempt fails', async () => {
    const repoId = RepoId.of('a-repo-id')
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(repoId, remoteUrl).rejects()
    const response = await request
      .post('/repos')
      .send({ repoId: repoId.value, remoteUrl })
      .expect(400)
    assertThat(response.body.error, containsString('Could not connect to a Git HTTP server'))
  })

  describe('validation', () => {
    it('responds with 400 (invalid request) when the request body is missing required content', async () => {
      const connectRepoRequest = {}
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(
        response.body.error,
        equalTo(
          "should have required property 'repoId', should have required property 'remoteUrl'",
        ),
      )
    })
  })
})

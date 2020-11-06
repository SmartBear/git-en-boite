import {
  AccessDenied,
  Application,
  InvalidRepoUrl,
  Logger,
  QueryResult,
  RemoteUrl,
  RepoId,
  RepoSnapshot,
} from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
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
    const webApp = createWebApp(router(app), Logger.none)
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

  it('responds with 400 if the connection attempt fails with InvalidRepoUrl', async () => {
    const repoId = RepoId.of('a-repo-id')
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(repoId, remoteUrl).rejects(new InvalidRepoUrl())
    const response = await request
      .post('/repos')
      .send({ repoId: repoId.value, remoteUrl })
      .expect(400)
    assertThat(response.text, equalTo(`Repository 'a-bad-url' not found.`))
  })

  it('responds with 403 if the connection attempt fails with AccessDenied', async () => {
    const repoId = RepoId.of('a-repo-id')
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(repoId, remoteUrl).rejects(new AccessDenied('Sorry!'))
    const response = await request
      .post('/repos')
      .send({ repoId: repoId.value, remoteUrl })
      .expect(403)
    assertThat(response.text, equalTo(`Access denied to 'a-bad-url': Sorry!`))
  })

  it('responds with 500 for any other type of error', async () => {
    const repoId = RepoId.of('a-repo-id')
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(repoId, remoteUrl).rejects(new Error('unexpected'))
    const response = await request
      .post('/repos')
      .send({ repoId: repoId.value, remoteUrl })
      .expect(500)
    assertThat(response.text, equalTo('Internal Server Error'))
  })

  describe('validation', () => {
    it('responds with 400 (invalid request) when the request body is malformed', async () => {
      const connectRepoRequest = { repoId: 1 }
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(
        response.text,
        equalTo(
          "payload.repoId should be string, payload should have required property 'remoteUrl'",
        ),
      )
    })
  })
})

import { AccessDenied, Application, InvalidRepoUrl, QueryResult, RemoteUrl, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, matchesPattern } from 'hamjest'
import { wasCalled } from 'hamjest-sinon'
import { Server } from 'http'
import LinkHeader from 'http-link-header'
import sinon from 'sinon'
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
    const webApp = createWebApp(router(app), () => ({}))
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  it('connects to the remote repo', async () => {
    const remoteUrl = RemoteUrl.of('../tmp')
    app.getInfo.resolves(QueryResult.from())
    app.connectToRemote.withArgs(sinon.match.instanceOf(RepoId), remoteUrl).resolves()
    await request.post('/repos').send({ remoteUrl }).expect(201)
    assertThat(app.connectToRemote, wasCalled())
  })

  it('puts a link to the repo in the header', async () => {
    const connectRepoRequest = { remoteUrl: '../tmp' }
    const createResponse = await request.post('/repos').send(connectRepoRequest)
    const uri = LinkHeader.parse(createResponse.headers.link).rel('item')[0].uri
    assertThat(uri, matchesPattern('repos/.*'))
  })

  it('responds with 400 if the connection attempt fails with InvalidRepoUrl', async () => {
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.connectToRemote.withArgs(sinon.match.any, remoteUrl).rejects(new InvalidRepoUrl())
    const response = await request.post('/repos').send({ remoteUrl }).expect(400)
    assertThat(response.text, equalTo(`No git repository found at that URL.`))
  })

  it('responds with 403 if the connection attempt fails with AccessDenied', async () => {
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.connectToRemote.withArgs(sinon.match.any, remoteUrl).rejects(new AccessDenied('Sorry!'))
    const response = await request.post('/repos').send({ remoteUrl }).expect(403)
    assertThat(response.text, equalTo(`Access denied: Sorry!`))
  })

  it('responds with 500 for any other type of error', async () => {
    const remoteUrl = RemoteUrl.of('a-bad-url')
    app.connectToRemote.withArgs(sinon.match.any, remoteUrl).rejects(new Error('unexpected'))
    const response = await request.post('/repos').send({ remoteUrl }).expect(500)
    assertThat(response.text, equalTo('Internal Server Error'))
  })

  describe('validation', () => {
    it('responds with 400 (invalid request) when the request body is malformed', async () => {
      const connectRepoRequest = { repoId: 1 }
      const response = await request.post('/repos').send(connectRepoRequest).expect(400)
      assertThat(response.text, equalTo("payload should have required property 'remoteUrl'"))
    })
  })
})

import { AccessDenied, Application, InvalidRepoUrl, RemoteUrl, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../create_web_app'
import router from '../router'

describe('/repos/:repoId', () => {
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

  describe('PUT', () => {
    it('creates a new repo', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('../tmp')
      app.connectToRemote.resolves()
      await request.put(`/repos/${repoId}`).send({ remoteUrl }).expect(200)
      assertThat(app.connectToRemote, wasCalledWith(repoId, remoteUrl))
    })

    it('updates an existing repo', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('../tmp')
      await app.connectToRemote(repoId, remoteUrl)

      const updatedRemoteUrl = RemoteUrl.of('../updated-tmp')
      app.connectToRemote.resolves()
      await request.put(`/repos/${repoId}`).send({ remoteUrl: updatedRemoteUrl }).expect(200)

      assertThat(app.connectToRemote, wasCalledWith(repoId, updatedRemoteUrl))
    })

    it('responds with 400 if the connection attempt fails with InvalidRepoUrl', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('a-bad-url')
      app.connectToRemote.withArgs(repoId, remoteUrl).rejects(new InvalidRepoUrl())
      const response = await request.put(`/repos/${repoId}`).send({ remoteUrl }).expect(400)
      assertThat(response.text, equalTo(`No git repository found at that URL.`))
    })

    it('responds with 403 if the connection attempt fails with AccessDenied', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('a-bad-url')
      app.connectToRemote.withArgs(repoId, remoteUrl).rejects(new AccessDenied('Sorry!'))
      const response = await request.put(`/repos/${repoId}`).send({ remoteUrl }).expect(403)
      assertThat(response.text, equalTo(`Access denied: Sorry!`))
    })

    describe('validation', () => {
      it('responds with 400 (invalid request) when the request body is malformed', async () => {
        const connectRepoRequest = { something: 'bad' }
        const response = await request.put(`/repos/1`).send(connectRepoRequest).expect(400)
        assertThat(response.text, equalTo("payload must have required property 'remoteUrl'"))
      })
    })
  })
})

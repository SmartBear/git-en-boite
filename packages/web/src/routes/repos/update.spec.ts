import { Application, Logger, RepoId } from 'git-en-boite-core'
import { assertThat } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from '../../create_web_app'
import router from '../router'

describe('POST /repos/:repoId', () => {
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

  it('fetches the Repo', async () => {
    const repoId = RepoId.of('a-repo-id')
    app.fetchFromRemote.resolves()
    await request.post(`/repos/${repoId}`).send().expect(200)
    assertThat(app.fetchFromRemote, wasCalledWith(repoId))
  })
})

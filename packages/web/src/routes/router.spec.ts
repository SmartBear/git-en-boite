import { Application, Logger, QueryResult, RepoId, RepoSnapshot } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

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
    const webApp = createWebApp(router(app), Logger.none)
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  const bareObject = <T>(object: T): Record<string, unknown> => JSON.parse(JSON.stringify(object))

  describe('GET /repos/:repoId', () => {
    it('returns an object with info about the repo', async () => {
      const repoInfo = new RepoSnapshot(RepoId.of('a-repo-id'), [])
      app.getInfo.resolves(QueryResult.from(repoInfo))
      const response = await request.get('/repos/a-repo-id').expect(200)
      assertThat(response.body, equalTo(bareObject(repoInfo)))
    })

    it("responds 404 if the repo doesn't exist", async () => {
      app.getInfo.resolves(QueryResult.from())
      await request.get('/repos/a-repo-id').expect(404)
    })
  })
})

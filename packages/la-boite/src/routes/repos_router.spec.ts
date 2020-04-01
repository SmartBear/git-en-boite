import supertest, { SuperTest, Test } from 'supertest'
import Koa from 'koa'
import { create } from './repos_router'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'

describe('/repos', () => {
  let request: SuperTest<Test>
  let server: Server

  beforeEach(() => {
    const app = new Koa()
    app.use(create().routes())
    server = app.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  describe('/:repoId/branches', () => {
    it('returns the branches in the repo: TODO', async () => {
      const response = await request.get('/repos/a-repo-id/branches').expect(200)
      assertThat(response.body, equalTo(['master']))
      server.close()
    })
  })
})

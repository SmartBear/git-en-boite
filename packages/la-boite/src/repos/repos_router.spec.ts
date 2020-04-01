import supertest, { SuperTest, Test } from 'supertest'
import Koa from 'koa'
import { create } from './repos_router'
import { GitRepo } from './git_repo'
import { GitRepos } from './git_repos'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'
import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute'

describe('/repos', () => {
  let request: SuperTest<Test>
  let server: Server
  let app: SubstituteOf<GitRepos>

  beforeEach(() => {
    app = Substitute.for<GitRepos>()
  })

  beforeEach(() => {
    const webApp = new Koa()
    webApp.use(create(app).routes())
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  describe('/:repoId/branches', () => {
    it('returns the branches in the repo: TODO', async () => {
      const repo = Substitute.for<GitRepo>()
      repo.branches.returns(['master'])
      app.findRepo('a-repo-id').returns(repo)
      const response = await request.get('/repos/a-repo-id/branches').expect(200)
      assertThat(response.body, equalTo(['master']))
      server.close()
    })
  })
})

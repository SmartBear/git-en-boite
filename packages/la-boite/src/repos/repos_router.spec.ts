import supertest, { SuperTest, Test } from 'supertest'
import { create } from './repos_router'
import { GitRepo } from './git_repo'
import { GitRepos } from './git_repos'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'
import WebApp from '../web_app'
import { stubInterface, StubbedInstance } from 'ts-sinon'
import { QueryResult } from '../query_result'

describe('/repos', () => {
  let request: SuperTest<Test>
  let server: Server
  let repos: StubbedInstance<GitRepos>

  beforeEach(() => {
    repos = stubInterface<GitRepos>()
  })

  beforeEach(() => {
    const routes = create({ repos })
    const webApp = WebApp.withRoutes(routes)
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  describe('GET /:repoId/branches', () => {
    it('returns the branches in the repo', async () => {
      const repo = stubInterface<GitRepo>()
      repo.branches.resolves(['master'])
      repos.findRepo.returns(new QueryResult(repo))
      const response = await request.get('/repos/a-repo-id/branches').expect(200)
      assertThat(response.body, equalTo(['master']))
      server.close()
    })

    it("responds 404 if the repo doesn't exist", async () => {
      repos.findRepo.returns(new QueryResult())
      await request.get('/repos/a-repo-id/branches').expect(404)
    })
  })

  describe('POST /', () => {
    it('connects to the remote repo', async () => {
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      repos.connectToRemote.withArgs(connectRepoRequest).resolves()
      await request.post('/repos').send(connectRepoRequest).expect(202)
      assertThat(repos.connectToRemote.called, equalTo(true))
    })
  })
})

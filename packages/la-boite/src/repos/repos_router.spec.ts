import { FetchRepoRequest, GitRepos, QueryResult } from 'git-en-boite-client-port'
import { Ref } from 'git-en-boite-core'
import { assertThat, equalTo } from 'hamjest'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import WebApp from '../web_app'
import { create } from './repos_router'

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

  const bareObject = (object: object): object => JSON.parse(JSON.stringify(object))

  describe('GET /repos/:repoId', () => {
    it('returns an object with info about the repo', async () => {
      const repoInfo = {
        repoId: 'a-repo-id',
        refs: [new Ref('abc123', 'refs/remotes/origin/master')],
      }
      repos.getInfo.resolves(QueryResult.from(repoInfo))
      const response = await request.get('/repos/a-repo-id').expect(200)
      assertThat(response.body, equalTo(bareObject(repoInfo)))
    })

    it("responds 404 if the repo doesn't exist", async () => {
      repos.getInfo.resolves(QueryResult.from())
      await request.get('/repos/a-repo-id').expect(404)
    })
  })

  describe('POST /repos/', () => {
    it('connects to the remote repo', async () => {
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      repos.getInfo.resolves(QueryResult.from())
      repos.connectToRemote.withArgs(connectRepoRequest).resolves()
      await request.post('/repos').send(connectRepoRequest).expect(202)
      assertThat(repos.connectToRemote.called, equalTo(true))
    })

    it('redirects to the repo if it already exists', async () => {
      const repoInfo = {
        repoId: 'a-repo-id',
        refs: [new Ref('abc123', 'refs/remotes/origin/master')],
      }
      repos.getInfo.resolves(QueryResult.from(repoInfo))
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      await request.post('/repos').send(connectRepoRequest).expect(302)
      const response = await request.post('/repos').send(connectRepoRequest).redirects(1)
      assertThat(response.body, equalTo(bareObject(repoInfo)))
    })
  })

  describe('POST /repos/:repoId', () => {
    it('triggers a fetch for the repo', async () => {
      const fetchRepoRequest: FetchRepoRequest = { repoId: 'a-repo-id' }
      repos.fetchFromRemote.withArgs(fetchRepoRequest).resolves()
      await request.post('/repos/a-repo-id').expect(202)
      assertThat(repos.fetchFromRemote.called, equalTo(true))
    })
  })
})

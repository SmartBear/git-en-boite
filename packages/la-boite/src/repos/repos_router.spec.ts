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
  let repos: SubstituteOf<GitRepos>

  beforeEach(() => {
    repos = Substitute.for<GitRepos>()
  })

  beforeEach(() => {
    const webApp = new Koa()
    webApp.use(create(repos).routes())
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  describe('GET /:repoId/branches', () => {
    it('returns the branches in the repo: TODO', async () => {
      const repo = Substitute.for<GitRepo>()
      repo.branches.returns(['master'])
      repos.findRepo('a-repo-id').returns(repo)
      const response = await request.get('/repos/a-repo-id/branches').expect(200)
      assertThat(response.body, equalTo(['master']))
      server.close()
    })
  })
  describe('POST /', () => {
    it('connects to the remote repo', async () => {
      const connectRepoRequest = { repoId: 'a-repo-id', remoteUrl: '../tmp' }
      repos.connectToRemote(connectRepoRequest).returns()
      await request.post('/repos').send(connectRepoRequest).expect(200)
      assertThat(repos.received().connectToRemote)
    })
  })
})

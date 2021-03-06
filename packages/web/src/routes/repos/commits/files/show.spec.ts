import { Application, CommitName, FileContent, FilePath, QueryResult, RepoId } from 'git-en-boite-core'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Server } from 'http'
import { assertThat } from 'hamjest'
import { wasCalledWith } from 'hamjest-sinon'

import createWebApp from '../../../../create_web_app'
import router from '../../../router'

describe('GET /repos/:repoId/commits/:ref/files/*location', () => {
  let request: SuperTest<Test>
  let server: Server
  let app: StubbedInstance<Application>
  const repoId = RepoId.of('repo-id')

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

  it('gets the file content', async () => {
    const revision = CommitName.of('abcdef123456')
    const location = new FilePath('features/MyFeature.feature')
    app.getFileContent.resolves(QueryResult.from(new FileContent('')))
    await request.get(`/repos/${repoId}/commits/${revision}/files/${location}`).expect(200)
    assertThat(app.getFileContent, wasCalledWith(repoId, revision, location))
  })

  it("responds 404 for a commit ref that doesn't exist", async () => {
    const revision = 'undefined-revision'
    const location = new FilePath('features/MyFeature.feature')
    app.getFileContent.resolves(QueryResult.from(null))
    await request.get(`/repos/${repoId}/commits/${revision}/files/${location}`).expect(404)
  })
})

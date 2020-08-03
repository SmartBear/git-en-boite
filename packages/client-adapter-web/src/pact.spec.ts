import { Verifier, VerifierOptions } from '@pact-foundation/pact'
import { Application, GitRepoInfo, QueryResult } from 'git-en-boite-client-port'
import { Server } from 'http'
import createWebApp from './create_web_app'
import router from './routes/router'
import path from 'path'
import { StubbedInstance, stubInterface } from 'ts-sinon'

const PORT = 8888

describe('backend http protocol', () => {
  let server: Server
  let app: StubbedInstance<Application>

  beforeEach(() => {
    app = stubInterface<Application>()
    const repoInfo: GitRepoInfo = {
      repoId: 'a-repo-id',
      branches: [],
    }
    app.getInfo.resolves(QueryResult.from(repoInfo))
    const webApp = createWebApp().use(router(app).routes()).use(router(app).allowedMethods())
    server = webApp.listen(PORT)
  })

  afterEach(() => {
    server.close()
  })

  const opts: VerifierOptions = {
    providerBaseUrl: `http://localhost:${PORT}`,
    pactUrls: [
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'pacts',
        'gitenboitegitrepo-gitenboiteservice.json',
      ),
    ],
    logLevel: 'info',
  }

  it.skip('test', async function () {
    this.timeout(5000)
    await new Verifier(opts).verifyProvider()
  })
})

import { Verifier, VerifierOptions } from '@pact-foundation/pact'
import { Application, QueryResult } from 'git-en-boite-client-port'
import { Server } from 'http'
import path from 'path'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import createWebApp from './create_web_app'
import router from './routes/router'

const PORT = 8888

describe('HTTP Api', () => {
  let server: Server
  let app: StubbedInstance<Application>

  beforeEach(() => {
    app = stubInterface<Application>()
    app.getInfo.withArgs('an-existing-repo-id').resolves(
      QueryResult.from({
        repoId: 'an-existing-repo-id',
        branches: [],
      }),
    )
    app.getInfo.withArgs('a-new-repo-id').resolves(QueryResult.from())
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

  it.only('fulfills the needs of the gherkin editor', async function () {
    this.timeout(5000)
    await new Verifier(opts).verifyProvider()
  })
})

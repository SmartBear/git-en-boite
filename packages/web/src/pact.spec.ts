import { Verifier, VerifierOptions } from '@pact-foundation/pact'
import { Application, QueryResult, RepoId, Unauthorized } from 'git-en-boite-core'
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
    const webApp = createWebApp(router(app), () => ({}))
    server = webApp.listen(PORT)
  })

  afterEach(() => {
    server.close()
  })

  const opts: VerifierOptions = {
    providerBaseUrl: `http://localhost:${PORT}`,
    pactUrls: [path.resolve(__dirname, '..', '..', '..', 'pacts', 'gherkineditor-gitenboite.json')],
    logLevel: 'info',
    stateHandlers: {
      'a repo exists': async () => {
        app.getInfo.resolves(
          QueryResult.from({
            repoId: RepoId.of('an-existing-repo-id'),
            branches: [],
          })
        )
      },
      'a new repo': async () => {
        app.getInfo.resolves(QueryResult.from())
      },
      'a repo with expired credentials, with a branch': async () => {
        app.commit.rejects(new Unauthorized())
      },
    },
  }

  it('@wip fulfills the needs of the gherkin editor', async function () {
    this.timeout(5000)
    await new Verifier(opts).verifyProvider()
  })
})

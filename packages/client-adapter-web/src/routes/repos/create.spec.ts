import { Application} from 'git-en-boite-client-port'
import { assertThat, throws, hasProperty, equalTo, not } from 'hamjest'
import { Server } from 'http'
import supertest, { SuperTest, Test } from 'supertest'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { InvalidRepoIdError, validateRepoId } from './create'
import createWebApp from '../../create_web_app'
import router from '../router'

describe('POST /repos/ validations', () => {

  let request: SuperTest<Test>
  let server: Server
  let app: StubbedInstance<Application>

  beforeEach(() => {
    app = stubInterface<Application>()
  })

  beforeEach(() => {
    const webApp = createWebApp().use(router(app).routes()).use(router(app).allowedMethods())
    server = webApp.listen(8888)
    request = supertest(server)
  })

  afterEach(() => {
    server.close()
  })

  it('responds with a message when request body is missing required content', async () => {
    const connectRepoRequest = {}
    const response = await request.post('/repos').send(connectRepoRequest).expect(400)
    assertThat(
      response.body.error,
      equalTo('Missing information from the request: repoId, remoteUrl'),
    )
  })

  it('responds with a message when repoId is not valid', async () => {
    const connectRepoRequest = { repoId: 'a/repo/id', remoteUrl: '../tmp' }
    const response = await request.post('/repos').send(connectRepoRequest).expect(400)
    assertThat(response.body.error, equalTo(InvalidRepoIdError.message))
  })
})

describe('validateRepoId', () => {
  it('does not throw InvalidRepoIdError when repoId is valid', async () =>
    assertThat(() => validateRepoId('valid.id'), not(throws())))

  it('throws InvalidRepoIdError when repoId is invalid', async () => {
    assertThat(
      () => validateRepoId('invalid/id'),
      throws(hasProperty('message', equalTo(InvalidRepoIdError.message))),
    )
  })
})
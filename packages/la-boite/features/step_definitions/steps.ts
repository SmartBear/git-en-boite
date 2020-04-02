/* tslint:disable: only-arrow-functions */
import { ClientApp } from '../../src/entity/ClientApp'
import { createConnection, Connection } from 'typeorm'

import { Given, When, Then, Before, TableDefinition } from 'cucumber'
import { Actor } from '../support/screenplay'
import { Repository } from 'typeorm'
import { User } from '../../src/entity/User'
import { createConfig } from '../../src/config'
import { assertThat, equalTo } from 'hamjest'

const config = createConfig(process.env)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withConnection = async (fn: any): Promise<any> => {
  const connection = await createConnection(config.database)
  const result = await fn(connection)
  await connection.close()
  return result
}

Before(() => withConnection((connection: Connection) => connection.dropDatabase()))

Given('an app {word}', async function (appId: string) {
  await withConnection(async (connection: Connection) => {
    const app = new ClientApp()
    app.id = appId
    const repository = connection.getRepository(ClientApp)
    await repository.save(app)
  })
})

When('{word} creates a user {word}', async function (appId: string, userId: string) {
  await withConnection(async (connection: Connection) => {
    const user = new User()
    user.id = userId
    const repository = connection.getRepository(ClientApp)
    const app: ClientApp = await repository.findOneOrFail(appId)
    app.users = app.users.concat([user])
    await repository.save(app)
  })
})

Then("the {word} app's users should be:", async function (
  appId: string,
  expectedUsers: TableDefinition,
) {
  const users = await withConnection(async (connection: Connection) => {
    const getRepository = connection.getRepository.bind(connection)
    const repository = await getRepository(ClientApp)
    const clientApp: ClientApp = await repository.findOneOrFail(appId)
    return clientApp.users
  })
  for (let i = 0; i < expectedUsers.raw().length; i++) {
    const row: string[] = expectedUsers.raw()[i]
    assertThat(users[i].id, equalTo(row[0]))
  }
})

Given('a {word} repo {string} with branches:', function (app, string, dataTable) {
  // TODO: Write code here that turns the phrase above into concrete actions
})

Given('a user {word} has valid credentials for the repo', function (userId) {
  // TODO: Write code here that turns the phrase above into concrete actions
})

When('{word} connects {word} to the repo', function (userId, app) {
  // TODO: Write code here that turns the phrase above into concrete actions
})

Then("{word} can see that the repo's branches are:", async function (
  userId: string,
  expectedBranches: TableDefinition,
) {
  const { request } = this
  const repoId = 'a-repo-id'
  const token = 'a-token'
  const response = await request
    .get(`/repos/${repoId}/branches`)
    .auth(userId, token)
    .set('Accept', 'application/json')
    .expect(200)
  assertThat(expectedBranches.raw()[0], equalTo(response.body))
})

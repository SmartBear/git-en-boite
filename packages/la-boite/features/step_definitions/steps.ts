/* tslint:disable: only-arrow-functions */
import { Given, When, Then, TableDefinition } from 'cucumber'
import { ClientApp } from '../../src/entity/ClientApp'
import { User } from '../../src/entity/User'
import { assertThat, equalTo } from 'hamjest'

Given('an app {word}', async function (appId: string) {
  const app = new ClientApp()
  app.id = appId
  const repository = this.connection.getRepository(ClientApp)
  await repository.save(app)
})

When('{word} creates a user {word}', async function (appId: string, userId: string) {
  const user = new User()
  user.id = userId
  const repository = this.connection.getRepository(ClientApp)
  const app: ClientApp = await repository.findOneOrFail(appId)
  app.users = app.users.concat([user])
  await repository.save(app)
})

Then("the {word} app's users should be:", async function (
  appId: string,
  expectedUsers: TableDefinition,
) {
  const repository = this.connection.getRepository(ClientApp)
  const clientApp: ClientApp = await repository.findOneOrFail(appId)
  const userIds = clientApp.users.map((user) => user.id)
  const expectedUserIds = expectedUsers.raw().map((user) => user[0])
  assertThat(userIds, equalTo(expectedUserIds))
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

When('the repo has synchronised', function () {
  // Write code here that turns the phrase above into concrete actions
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

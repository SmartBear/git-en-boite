/* tslint:disable: only-arrow-functions */
import { Given, When, Then, TableDefinition } from 'cucumber'
import { ClientApp } from '../../src/entity/ClientApp'
import { User } from '../../src/entity/User'
import { assertThat, equalTo } from 'hamjest'
import path from 'path'
import { GitProcess } from 'dugite'
import childProcess from 'child_process'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)

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
  const userIds = clientApp.users.map(user => user.id)
  const expectedUserIds = expectedUsers.raw().map(user => user[0])
  assertThat(userIds, equalTo(expectedUserIds))
})

Given('a {word} repo {string} with branches:', async function (
  providerType,
  repoId,
  branchesTable,
) {
  const branches = branchesTable.raw().map((row: string[]) => row[0])
  const repoPath = (this.repoRemoteUrl = path.resolve(
    __dirname,
    '../../tmp/remote',
    providerType,
    repoId,
  ))
  await exec(`mkdir -p ${repoPath}`)
  const git = async (...args: string[]) => {
    const result = await GitProcess.exec(args, repoPath)
    if (result.exitCode > 0) throw new Error(result.stderr)
  }
  await git('init')
  await git('config', 'user.email', 'test@example.com')
  await git('config', 'user.name', 'Test User')
  for (const branchName of branches) {
    await git('checkout', '-b', branchName)
    await git('commit', '--allow-empty', '-m "test"')
  }
})

Given('a user {word} has valid credentials for the repo', function (userId) {
  // TODO: Write code here that turns the phrase above into concrete actions
})

When('{word} connects an app to the repo', async function (userId) {
  const { request } = this
  const repoId = 'a-repo-id'
  const token = 'a-token'
  const repoInfo = { repoId, remoteUrl: this.repoRemoteUrl }
  await request.post('/repos').send(repoInfo).auth(userId, token).expect(200)
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

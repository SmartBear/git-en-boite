/* tslint:disable: only-arrow-functions */
import { Given, When, Then, TableDefinition } from 'cucumber'
import { ClientApp } from '../../src/entity/ClientApp'
import { User } from '../../src/entity/User'
import { assertThat, equalTo, containsInAnyOrder } from 'hamjest'
import path from 'path'
import { LocalGitRepo } from '../../src/repos/local_git_repo'
import { GitRepoInfo } from '../../src/repos/interfaces'

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

Given('a repo with branches:', async function (branchesTable) {
  const branches = branchesTable.raw().map((row: string[]) => row[0])
  const repoId = (this.repoId = 'a-repo-id')
  const repoPath = (this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', repoId))
  const repo = await LocalGitRepo.open(repoPath)
  await repo.git('init')
  await repo.git('config', 'user.email', 'test@example.com')
  await repo.git('config', 'user.name', 'Test User')
  for (const branchName of branches) {
    await repo.git('checkout', '-b', branchName)
    await repo.git('commit', '--allow-empty', '-m "test"')
  }
})

Given('a remote repo with commits on the master branch', async function () {
  const repoId = (this.repoId = 'a-repo-id')
  const repoPath = (this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', repoId))
  const repo = await LocalGitRepo.open(repoPath)
  await repo.git('init')
  await repo.git('config', 'user.email', 'test@example.com')
  await repo.git('config', 'user.name', 'Test User')
  await repo.git('checkout', '-b', 'master')
  await repo.git('commit', '--allow-empty', '-m "test"')
})

When('a new commit is made in the remote repo', async function () {
  const repoId = (this.repoId = 'a-repo-id')
  const repoPath = (this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', repoId))
  const repo = await LocalGitRepo.open(repoPath)
  await repo.git('commit', '--allow-empty', '-m "another commit"')
  this.lastCommitRevision = (await repo.git('rev-parse', 'HEAD')).stdout.trim()
})

When('Bob connects an app to the repo', async function () {
  const { request } = this
  const repoId = 'a-repo-id'
  const repoInfo = { repoId, remoteUrl: this.repoRemoteUrl }
  await request.post('/repos').send(repoInfo).expect(202)
})

When('a consumer triggers a manual fetch of the repo', async function () {
  const { request } = this
  const repoId = 'a-repo-id'
  await request.post(`/repos/${repoId}`).expect(202)
})

When('the repo has synchronised', async function () {
  await this.app.repos.waitUntilIdle('a-repo-id')
})

Given('the repo has been connected', async function () {
  const { request } = this
  const repoId = 'a-repo-id'
  const repoInfo = { repoId, remoteUrl: this.repoRemoteUrl }
  await request.post('/repos').send(repoInfo).expect(202)
  await this.app.repos.waitUntilIdle('a-repo-id')
})

Then("Bob can see that the repo's refs are:", async function (expectedRefsTable: TableDefinition) {
  const expectedRefNames = expectedRefsTable.raw().map(row => row[0])
  const { request } = this
  const repoId = 'a-repo-id'
  const response = await request
    .get(`/repos/${repoId}`)
    .set('Accept', 'application/json')
    .expect(200)
  assertThat(
    (response.body as GitRepoInfo).refs.map(ref => ref.name),
    containsInAnyOrder(...expectedRefNames),
  )
})

Then("Bob can see that the repo's branches are:", async function (
  expectedBranchesTable: TableDefinition,
) {
  const expectedBranchNames = expectedBranchesTable.raw().map(row => row[0])
  const { request } = this
  const repoId = 'a-repo-id'
  const response = await request
    .get(`/repos/${repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.map(branch => branch.name),
    containsInAnyOrder(...expectedBranchNames),
  )
})

Then('the repo should have the new commit at the head of the master branch', async function () {
  const { request } = this
  const repoId = 'a-repo-id'
  const response = await request
    .get(`/repos/${repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.find(branch => branch.name === 'master').revision,
    equalTo(this.lastCommitRevision),
  )
})

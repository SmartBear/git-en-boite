/* tslint:disable: only-arrow-functions */
import { Given, TableDefinition, Then, When } from 'cucumber'
import { GitRepoInfo } from 'git-en-boite-client-port'
import { NonBareRepoFactory } from 'git-en-boite-local-git'
import { Commit, EnsureBranchExists, GetRevision } from 'git-en-boite-local-git'
import { assertThat, containsInAnyOrder, equalTo, hasProperty, matchesPattern, not } from 'hamjest'
import path from 'path'

Given('a remote repo with branches:', async function (branchesTable) {
  const branches = branchesTable.raw().map((row: string[]) => row[0])
  const repoId = (this.repoId = this.getNextRepoId())
  this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', repoId)
  const git = await new NonBareRepoFactory().open(this.repoRemoteUrl)
  await git(Commit.withMessage('Initial commit'))
  for (const branchName of branches) {
    await git(EnsureBranchExists.named(branchName))
    await git(Commit.withAnyMessage())
  }
})

Given('a remote repo with commits on the master branch', async function () {
  this.repoId = this.getNextRepoId()
  this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', this.repoId)
  const git = await new NonBareRepoFactory().open(this.repoRemoteUrl)
  await git(Commit.withAnyMessage())
})

When('a new commit is made in the remote repo', async function () {
  const git = await new NonBareRepoFactory().open(this.repoRemoteUrl)
  await git(Commit.withAnyMessage())
  this.lastCommitRevision = await git(GetRevision.forBranchNamed('master'))
})

Given('the remote repo has been connected', async function () {
  const repoInfo = { repoId: this.repoId, remoteUrl: this.repoRemoteUrl }
  await this.request.post('/repos').send(repoInfo).expect(202)
})

When('a consumer tries to connect to a bad remote URL', async function () {
  this.repoId = this.getNextRepoId()
  const repoInfo = { repoId: this.repoId, remoteUrl: 'a-bad-url' }
  const response = await this.request.post('/repos').send(repoInfo)
  this.lastResponseCode = response.res.statusCode
})

When('a consumer triggers a manual fetch of the repo', async function () {
  await this.request.post(`/repos/${this.repoId}`).expect(202)
})

When('the fetch has finished', async function () {
  // nothing to do for now - the fetch is immeditately consistent
})

Then("the repo's refs should be:", async function (expectedRefsTable: TableDefinition) {
  const expectedRefNames = expectedRefsTable.raw().map(row => row[0])
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)
  assertThat(
    (response.body as GitRepoInfo).refs.map(ref => ref.refName),
    containsInAnyOrder(...expectedRefNames),
  )
})

Then("the repo's branches should be:", async function (expectedBranchesTable: TableDefinition) {
  const expectedBranchNames = expectedBranchesTable.raw().map(row => row[0])
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.map(branch => branch.name),
    containsInAnyOrder(...expectedBranchNames),
  )
})

Then('the repo should have the new commit at the head of the master branch', async function () {
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.find(branch => branch.name === 'master').revision,
    equalTo(this.lastCommitRevision),
  )
})

Then('the repo should have a connection status of {string}', async function (
  expectedConnectionStatus: string,
) {
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  const repoInfo: GitRepoInfo = response.body
  assertThat(repoInfo, hasProperty('connectionStatus', equalTo(expectedConnectionStatus)))
})

Then('it should respond with an error', function () {
  assertThat(String(this.lastResponseCode), not(matchesPattern(/2\d\d/)))
})

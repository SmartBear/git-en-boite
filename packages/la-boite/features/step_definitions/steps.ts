/* tslint:disable: only-arrow-functions */
import { Given, TableDefinition, Then, When } from 'cucumber'
import { GitRepoInfo } from 'git-en-boite-client-port'
import { NonBareRepoFactory } from 'git-en-boite-git-adapter'
import { Commit, EnsureBranchExists, GetRevision, Init } from 'git-en-boite-git-port'
import { assertThat, containsInAnyOrder, equalTo } from 'hamjest'
import path from 'path'

Given('a repo with branches:', async function (branchesTable) {
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

When('Bob connects an app to the repo', async function () {
  const repoInfo = { repoId: this.repoId, remoteUrl: this.repoRemoteUrl }
  await this.request.post('/repos').send(repoInfo).expect(202)
})

When('a consumer triggers a manual fetch of the repo', async function () {
  await this.request.post(`/repos/${this.repoId}`).expect(202)
})

When('the repo has synchronised', async function () {
  await this.app.repos.waitUntilIdle(this.repoId)
})

Given('the repo has been connected', async function () {
  const { request } = this
  const repoInfo = { repoId: this.repoId, remoteUrl: this.repoRemoteUrl }
  await request.post('/repos').send(repoInfo).expect(202)
  await this.app.repos.waitUntilIdle(this.repoId)
})

Then("Bob can see that the repo's refs are:", async function (expectedRefsTable: TableDefinition) {
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

Then("Bob can see that the repo's branches are:", async function (
  expectedBranchesTable: TableDefinition,
) {
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

/* tslint:disable: only-arrow-functions */
import { Given, TableDefinition, Then, When } from 'cucumber'
import { File, GitRepoInfo, Author, BranchName, RefName } from 'git-en-boite-core'
import {
  RepoFactory,
  Commit,
  GetFiles,
  GetRefs,
  LocalCommitRef,
  GitDirectory,
} from 'git-en-boite-local-git'
import {
  assertThat,
  contains,
  containsInAnyOrder,
  equalTo,
  hasProperty,
  matchesPattern,
  not,
  containsString,
} from 'hamjest'
import path from 'path'
import { DiskRepoIndex } from 'git-en-boite-repo-index/dist'

Given('a remote repo with branches:', async function (branchesTable) {
  const branches = branchesTable.raw().map((row: string[]) => BranchName.of(row[0]))
  const repoId = (this.repoId = this.getNextRepoId())
  this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', repoId)
  const git = await new RepoFactory().open(this.repoRemoteUrl)
  for (const branchName of branches) {
    await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  }
})

Given('a remote repo with commits on {BranchName}', async function (branchName: BranchName) {
  this.repoId = this.getNextRepoId()
  this.repoRemoteUrl = path.resolve(this.tmpDir, 'remote', this.repoId)
  const git = await new RepoFactory().open(this.repoRemoteUrl)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
})

When('a new commit is made on the {string} branch in the remote repo', async function (
  branchName: string,
) {
  const git = await new RepoFactory().open(this.repoRemoteUrl)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(BranchName.of(branchName))))
  this.lastCommitRevision = (await git(GetRefs.all())).forBranch(BranchName.of(branchName)).revision
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

When('a consumer triggers a manual fetch of the repo', fetch)
Given('the repo has been fetched', fetch)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetch(this: any) {
  await this.request.post(`/repos/${this.repoId}`).expect(202)
}

When('a consumer commits a new file to the {string} branch', async function (branchName: string) {
  const file: File = {
    path: 'features/new.feature',
    content: 'Feature: New!',
  }
  this.file = file
  await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({ files: [file], author: new Author('Bob', 'bob@example.com') })
    .set('Accept', 'application/json')
    .expect(200)
})

When('a consumer commits to the {string} branch with:', async function (
  branchName,
  commitDetails: TableDefinition,
) {
  const row = commitDetails.hashes()[0]
  const author = new Author(row['Author name'], row['Author email'])
  await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({ files: [], author })
    .set('Accept', 'application/json')
    .expect(200)
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

Then('the repo should have the new commit at the head of the {string} branch', async function (
  branchName: string,
) {
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.find(branch => branch.name === branchName).revision,
    equalTo(this.lastCommitRevision),
  )
})

Then('it should respond with an error', function () {
  assertThat(String(this.lastResponseCode), not(matchesPattern(/2\d\d/)))
})

Then('the file should be in the {string} branch of the remote repo', async function (
  branchName: string,
) {
  const git = await new RepoFactory().open(this.repoRemoteUrl)
  const files = await git(GetFiles.for(BranchName.of(branchName)))
  assertThat(files, contains(this.file))
})

Then(
  'the remote repo should have a new commit at the head of the {string} branch:',
  async function (branchName, commitDetails) {
    const branchRef = RefName.localBranch(BranchName.of(branchName))
    const repo = new GitDirectory(this.repoRemoteUrl)
    const lastCommit = await repo.read('cat-file', ['-p', branchRef.value])
    const row = commitDetails.hashes()[0]
    const author = new Author(row['Author name'], row['Author email'])
    assertThat(lastCommit, containsString(author.toString()))
  },
)

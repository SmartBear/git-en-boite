/* tslint:disable: only-arrow-functions */
import { Given, TableDefinition, Then, When } from 'cucumber'
import {
  Author,
  BranchName,
  CommitMessage,
  File,
  GitRepoInfo,
  RefName,
  RepoId,
} from 'git-en-boite-core'
import {
  Commit,
  GetFiles,
  GetRefs,
  GitDirectory,
  LocalCommitRef,
  RepoFactory,
} from 'git-en-boite-local-git'
import {
  assertThat,
  contains,
  containsInAnyOrder,
  containsString,
  equalTo,
  matchesPattern,
  not,
} from 'hamjest'
import path from 'path'

Given('a remote repo with branches:', async function (branchesTable) {
  const repoId = (this.repoId = RepoId.generate())
  this.remoteRepoPath = path.resolve(this.tmpDir, 'remote', repoId.value)
  const git = await new RepoFactory().open(this.remoteRepoPath)
  const branches = branchesTable.raw().map((row: string[]) => BranchName.of(row[0]))
  for (const branchName of branches) {
    await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  }
})

Given('a remote repo with commits on {BranchName}', async function (branchName: BranchName) {
  const repoId = (this.repoId = RepoId.generate())
  this.remoteRepoPath = path.resolve(this.tmpDir, 'remote', repoId.value)
  const git = await new RepoFactory().open(this.remoteRepoPath)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
})

When('a new commit is made on {BranchName} in the remote repo', async function (
  branchName: BranchName,
) {
  const git = await new RepoFactory().open(this.remoteRepoPath)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  this.lastCommitRevision = (await git(GetRefs.all())).forBranch(branchName).revision
})

Given('the remote repo has been connected', async function () {
  const repoInfo = { repoId: this.repoId, remoteUrl: this.remoteRepoPath }
  await this.request.post('/repos').send(repoInfo).expect(202)
})

When('a consumer tries to connect to a bad remote URL', async function () {
  this.repoId = RepoId.generate()
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

When('a consumer commits a new file to {BranchName}', async function (branchName: BranchName) {
  const file: File = {
    path: 'features/new.feature',
    content: 'Feature: New!',
  }
  this.file = file
  await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({
      files: [file],
      author: new Author('Bob', 'bob@example.com'),
      message: new CommitMessage('adding a file'),
    })
    .set('Accept', 'application/json')
    .expect(200)
})

When('a consumer commits to {BranchName} with:', async function (
  branchName: BranchName,
  commitDetails: TableDefinition,
) {
  const row = commitDetails.hashes()[0]
  const author = new Author(row['Author name'], row['Author email'])
  const message = new CommitMessage(row['Commit message'])
  await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({ files: [], author, message })
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

Then('the repo should have the new commit at the head of {BranchName}', async function (
  branchName: BranchName,
) {
  const response = await this.request
    .get(`/repos/${this.repoId}`)
    .set('Accept', 'application/json')
    .expect(200)

  assertThat(
    (response.body as GitRepoInfo).branches.find(branch => branch.name === branchName.value)
      .revision,
    equalTo(this.lastCommitRevision),
  )
})

Then('it should respond with an error', function () {
  assertThat(String(this.lastResponseCode), not(matchesPattern(/2\d\d/)))
})

Then('the file should be in {BranchName} of the remote repo', async function (
  branchName: BranchName,
) {
  const git = await new RepoFactory().open(this.remoteRepoPath)
  const files = await git(GetFiles.for(branchName))
  assertThat(files, contains(this.file))
})

Then('the remote repo should have a new commit at the head of {BranchName}:', async function (
  branchName: BranchName,
  commitDetails: TableDefinition,
) {
  const branchRef = RefName.localBranch(branchName)
  const repo = new GitDirectory(this.remoteRepoPath)
  const lastCommit = await repo.read('cat-file', ['-p', branchRef.value])
  const row = commitDetails.hashes()[0]
  const author = new Author(row['Author name'], row['Author email'])
  const message = new CommitMessage(row['Commit message'])
  assertThat(lastCommit, containsString(author.toString()))
  assertThat(lastCommit, containsString(message.toString()))
})

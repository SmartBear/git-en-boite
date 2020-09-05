/* tslint:disable: only-arrow-functions */
import { Given, TableDefinition, Then, When } from 'cucumber'
import {
  Author,
  BranchName,
  CommitMessage,
  Email,
  FileContent,
  FilePath,
  GitFile,
  NameOfPerson,
  RefName,
  RepoId,
  RepoSnapshot,
  Repo,
  RepoFetched,
  DomainEventBus,
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
  not,
  promiseThat,
  fulfilled,
} from 'hamjest'
import path from 'path'

import { isSuccess } from '../support/matchers/is_success'

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

Given('the remote repo has been connected', connect)
When('a consumer connects the remote repo', connect)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connect(this: any) {
  const repoInfo = { repoId: this.repoId, remoteUrl: this.remoteRepoPath }
  await this.request.post('/repos').send(repoInfo).expect(202)
}

When('a consumer tries to connect to the remote URL {string}', async function (remoteUrl) {
  this.repoId = RepoId.generate()
  const repoInfo = { repoId: this.repoId, remoteUrl }
  this.lastResponse = await this.request.post('/repos').send(repoInfo)
})

When('a consumer tries to connect using a malformed payload', async function () {
  this.lastResponse = await this.request.post('/repos').send('garbage')
})

When('a consumer triggers a manual fetch of the repo', fetch)
Given('the repo has been fetched', fetch)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetch(this: any) {
  await this.request.post(`/repos/${this.repoId}`).expect(202)
}

When('a consumer commits a new file to {BranchName}', async function (branchName: BranchName) {
  const file = new GitFile(new FilePath('features/new.feature'), new FileContent('Feature: New!'))
  this.file = file
  const response = await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({
      files: [file],
      author: new Author(new NameOfPerson('Bob'), new Email('bob@example.com')),
      message: CommitMessage.of('adding a file'),
    })
    .set('Accept', 'application/json')
  assertThat(response, isSuccess())
})

When('a consumer commits to {BranchName} with:', async function (
  branchName: BranchName,
  commitDetails: TableDefinition,
) {
  const row = commitDetails.hashes()[0]
  const author = new Author(
    new NameOfPerson(row['Author name']),
    new NameOfPerson(row['Author email']),
  )
  const message = CommitMessage.of(row['Commit message'])
  const response = await this.request
    .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
    .send({ files: [], author, message })
    .set('Accept', 'application/json')
  assertThat(response, isSuccess())
})

Then("the repo's branches should be:", async function (expectedBranchesTable: TableDefinition) {
  const expectedBranchNames = expectedBranchesTable.raw().map(row => row[0])
  const response = await this.request.get(`/repos/${this.repoId}`).set('Accept', 'application/json')
  assertThat(response, isSuccess())

  assertThat(
    (response.body as RepoSnapshot).branches.map(branch => branch.name),
    containsInAnyOrder(...expectedBranchNames),
  )
})

Then('the repo should have the new commit at the head of {BranchName}', async function (
  branchName: BranchName,
) {
  const response = await this.request.get(`/repos/${this.repoId}`).set('Accept', 'application/json')
  assertThat(response, isSuccess())
  assertThat(
    RepoSnapshot.fromJSON(response.body).branches.find(branchSnapshot =>
      branchName.equals(branchSnapshot.name),
    ).revision,
    equalTo(this.lastCommitRevision),
  )
})

Then('it should respond with an error:', function (expectedJSON) {
  assertThat(this.lastResponse, not(isSuccess()))
  assertThat(this.lastResponse.body, equalTo(JSON.parse(expectedJSON)))
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
  const author = new Author(new NameOfPerson(row['Author name']), new Email(row['Author email']))
  const message = CommitMessage.of(row['Commit message'])
  assertThat(lastCommit, containsString(author.toString()))
  assertThat(lastCommit, containsString(message.toString()))
})

Then('the repo should be fetched', async function () {
  const domainEvents = this.domainEvents as DomainEventBus
  const waitingForEvent = new Promise(received => {
    domainEvents.on('repo.fetched', event => {
      if (event.repoId.equals(this.repoId)) received()
    })
  })
  await promiseThat(waitingForEvent, fulfilled())
})

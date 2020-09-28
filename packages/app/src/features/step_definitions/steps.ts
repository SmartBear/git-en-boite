/* tslint:disable: only-arrow-functions */
import fs from 'fs'
import { After, DataTable, Given, Then, When } from '@cucumber/cucumber'
import EventSource from 'eventsource'
import {
  Author,
  BranchName,
  CommitMessage,
  DomainEvents,
  Email,
  FileContent,
  FilePath,
  GitFile,
  NameOfPerson,
  RefName,
  RepoId,
  RepoSnapshot,
  SubscribesToDomainEvents,
} from 'git-en-boite-core'
import {
  Commit,
  openBareRepo,
  GetFiles,
  GetRefs,
  GitDirectory,
  Init,
  LocalCommitRef,
  createBareRepo,
} from 'git-en-boite-local-git'
import {
  assertThat,
  contains,
  containsInAnyOrder,
  containsString,
  equalTo,
  fulfilled,
  not,
  promiseThat,
} from 'hamjest'

import { isSuccess } from '../support/matchers/is_success'
import { World } from '../support/world'

Given('a remote repo with branches:', async function (this: World, branchesTable: DataTable) {
  this.repoId = RepoId.generate()
  const branches = branchesTable.raw().map((row: string[]) => BranchName.of(row[0]))
  const repoPath = this.remotePath(this.repoId)
  fs.mkdirSync(repoPath, { recursive: true })
  const git = await openBareRepo(repoPath)
  await git(Init.bareRepo())
  for (const branchName of branches) {
    await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  }
})

Given('a remote repo with commits on {BranchName}', async function (
  this: World,
  branchName: BranchName,
) {
  this.repoId = RepoId.generate()
  const repoPath = this.remotePath(this.repoId)
  const git = await createBareRepo(repoPath)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
})

When('a new commit is made on {BranchName} in the remote repo', async function (
  this: World,
  branchName: BranchName,
) {
  const git = await openBareRepo(this.remotePath(this.repoId))
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  this.lastCommitRevision = (await git(GetRefs.all())).forBranch(branchName).revision
})

Given('a consumer has connected the remote repo', connect)
When('a consumer connects the remote repo', connect)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connect(this: any) {
  const repoInfo = { repoId: this.repoId, remoteUrl: this.remoteUrl(this.repoId) }
  await this.request.post('/repos').send(repoInfo).expect(202)
}

When('a consumer tries to connect to the remote URL {string}', async function (
  this: World,
  remoteUrl: string,
) {
  this.repoId = RepoId.generate()
  const repoInfo = { repoId: this.repoId, remoteUrl }
  this.lastResponse = await this.request.post('/repos').send(repoInfo)
})

When('a consumer tries to connect using a malformed payload', async function (this: World) {
  this.lastResponse = await this.request.post('/repos').send('garbage')
})

When('a consumer triggers a manual fetch of the repo', async function (this: World) {
  await this.request.post(`/repos/${this.repoId}`).expect(202)
})

Given('the repo has been fetched', async function (this: World) {
  const domainEvents = this.domainEvents as SubscribesToDomainEvents
  await promiseThat(
    new Promise(received =>
      domainEvents.on('repo.fetched', event => event.repoId.equals(this.repoId) && received()),
    ),
    fulfilled(),
  )
})

When('a consumer commits a new file to {BranchName}', async function (
  this: World,
  branchName: BranchName,
) {
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
  this: World,
  branchName: BranchName,
  commitDetails: DataTable,
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

const closables: Array<{ close: () => void }> = []
When('a consumer is listening to the events on the repo', async function (this: World) {
  this.events = []
  const events = new EventSource(`http://localhost:8888/repos/${this.repoId}/events`)
  for (const eventKey of DomainEvents.keys) {
    events.addEventListener(eventKey, (event: Event) => {
      this.events.push(event.type)
    })
  }
  closables.push(events)
})
After(() => {
  for (const closable of closables) {
    closable.close()
  }
})

Then("the repo's branches should be:", async function (
  this: World,
  expectedBranchesTable: DataTable,
) {
  const expectedBranchNames = expectedBranchesTable.raw().map(row => row[0])
  const response = await this.request.get(`/repos/${this.repoId}`).set('Accept', 'application/json')
  assertThat(response, isSuccess())

  assertThat(
    (response.body as RepoSnapshot).branches.map(branch => branch.name),
    containsInAnyOrder(...expectedBranchNames),
  )
})

Then('the repo should have the new commit at the head of {BranchName}', async function (
  this: World,
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

Then('it should respond with an error:', function (this: World, expectedMessage: string) {
  assertThat(this.lastResponse, not(isSuccess()))
  assertThat(this.lastResponse.text, equalTo(expectedMessage))
})

Then('the file should be in {BranchName} of the remote repo', async function (
  this: World,
  branchName: BranchName,
) {
  const git = await openBareRepo(this.remotePath(this.repoId))
  const files = await git(GetFiles.for(branchName))
  assertThat(files, contains(this.file))
})

Then('the remote repo should have a new commit at the head of {BranchName}:', async function (
  this: World,
  branchName: BranchName,
  commitDetails: DataTable,
) {
  const branchRef = RefName.localBranch(branchName)
  const repo = new GitDirectory(this.remotePath(this.repoId))
  const lastCommit = await repo.read('cat-file', ['-p', branchRef.value])
  const row = commitDetails.hashes()[0]
  const author = new Author(new NameOfPerson(row['Author name']), new Email(row['Author email']))
  const message = CommitMessage.of(row['Commit message'])
  assertThat(lastCommit, containsString(author.toString()))
  assertThat(lastCommit, containsString(message.toString()))
})

Then('the repo should have been fetched', async function (this: World) {
  await promiseThat(
    new Promise(received =>
      this.domainEvents.on('repo.fetched', event => event.repoId.equals(this.repoId) && received()),
    ),
    fulfilled(),
  )
})

Then('the events received by the consumer should be:', function (
  this: World,
  expectedEvents: string,
) {
  assertThat(this.events, equalTo(expectedEvents.split('\n')))
})

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
  RemoteUrl,
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
} from 'git-en-boite-local-clones'
import { assertThat, contains, containsInAnyOrder, containsString, equalTo, fulfilled, not, promiseThat } from 'hamjest'

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

Given('a remote repo with commits on {BranchName}', async function (this: World, branchName: BranchName) {
  this.repoId = RepoId.generate()
  const repoPath = this.remotePath(this.repoId)
  const git = await createBareRepo(repoPath)
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
})

When('a new commit is made on {BranchName} in the remote repo', commitToRemote)
Given('the remote has moved forward on {BranchName}', commitToRemote)
async function commitToRemote(this: World, branchName: BranchName) {
  const git = await openBareRepo(this.remotePath(this.repoId))
  await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
  this.lastCommitRevision = (await git(GetRefs.all())).forBranch(branchName).revision
}

Given('a consumer has connected the remote repo', connect)
When('a consumer connects the remote repo', connect)
async function connect(this: World) {
  const repoInfo = { remoteUrl: this.remoteUrl(this.repoId) }
  await this.request.put(`/repos/${this.repoId}`).send(repoInfo).expect(200)
}

Given('a consumer has failed to connect to a remote repo', async function (this: World) {
  this.repoId = RepoId.generate()
  const repoInfo = { remoteUrl: 'a-bad-url' }
  await this.request.put(`/repos/${this.repoId}`).send(repoInfo).expect(400)
})

Given('a remote repo with a file commited to {BranchName}', async function (this: World, branchName: BranchName) {
  this.repoId = RepoId.generate()
  this.file = GitFile.fromJSON({ path: 'my/feature.feature', content: 'Feature: My feature' })
  const repoPath = this.remotePath(this.repoId)
  await createBareRepo(repoPath)
  // TODO: await git(Commit.toCommitRef(LocalCommitRef.forBranch(branchName)))
})

const connectRepo = async function (this: World, remoteUrl: RemoteUrl) {
  const repoInfo = { remoteUrl }
  this.lastResponse = await this.request.put(`/repos/${this.repoId}`).send(repoInfo)
}

When('a consumer tries to connect to the remote repo', async function (this: World) {
  await connectRepo.bind(this).call(this, this.remoteUrl(this.repoId))
})

When('a consumer tries to connect to the remote URL {string}', async function (this: World, remoteUrl: string) {
  this.repoId = RepoId.generate()
  await connectRepo.bind(this).call(this, RemoteUrl.of(remoteUrl))
})

When("a/the consumer tries to get the repo's info", async function (this: World) {
  this.lastResponse = await this.request.get(`/repos/${this.repoId}`)
})

When('a consumer tries to connect using a malformed payload', async function (this: World) {
  this.repoId = RepoId.generate()
  this.lastResponse = await this.request.put(`/repos/${this.repoId}`).send('garbage')
})

When('a consumer triggers a manual fetch of the repo', async function (this: World) {
  assertThat(await this.request.post(`/repos/${this.repoId}`), isSuccess())
})

When('a consumer tries to trigger a manual fetch of the repo', async function (this: World) {
  this.lastResponse = await this.request.post(`/repos/${this.repoId}`)
})

Given('the repo has been fetched', async function (this: World) {
  const domainEvents = this.domainEvents as SubscribesToDomainEvents
  await promiseThat(
    new Promise<void>((received) =>
      domainEvents.on('repo.fetched', (event) => event.repoId.equals(this.repoId) && received())
    ),
    fulfilled()
  )
})

When(
  'a consumer commits a new file to {BranchName}',
  { timeout: 10 * 1000 },
  async function (this: World, branchName: BranchName) {
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
  }
)

When(
  'a consumer commits to {BranchName} with:',
  async function (this: World, branchName: BranchName, commitDetails: DataTable) {
    const row = commitDetails.hashes()[0]
    const author = new Author(new NameOfPerson(row['Author name']), new NameOfPerson(row['Author email']))
    const message = CommitMessage.of(row['Commit message'])
    const response = await this.request
      .post(`/repos/${this.repoId}/branches/${branchName}/commits`)
      .send({ files: [], author, message })
      .set('Accept', 'application/json')
    assertThat(response, isSuccess())
  }
)

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

When('a consumer changes the remote url', async function (this: World) {
  const updateRemote = RepoId.of(`updated-${this.repoId.value}`)
  this.moveRemoteToPath(this.remotePath(this.repoId), this.remotePath(updateRemote))
  const updatedRemoteUrl = this.remoteUrl(updateRemote)
  const waitForRemoteToBeFetched = new Promise<void>((received) =>
    this.domainEvents.on('repo.fetched', (event) => event.repoId.equals(this.repoId) && received())
  )
  await this.request
    .put(`/repos/${this.repoId}`)
    .send({ remoteUrl: updatedRemoteUrl })
    .set('Accept', 'application/json')
  await promiseThat(waitForRemoteToBeFetched, fulfilled())
})

Then("the repo's branches should be:", async function (this: World, expectedBranchesTable: DataTable) {
  const expectedBranchNames = expectedBranchesTable.raw().map((row) => row[0])
  const response = await this.request.get(`/repos/${this.repoId}`).set('Accept', 'application/json')
  assertThat(response, isSuccess())

  assertThat(
    (response.body as RepoSnapshot).branches.map((branch) => branch.name),
    containsInAnyOrder(...expectedBranchNames)
  )
})

Then(
  'the repo should have the new commit at the head of {BranchName}',
  async function (this: World, branchName: BranchName) {
    const response = await this.request.get(`/repos/${this.repoId}`).set('Accept', 'application/json')
    assertThat(response, isSuccess())
    assertThat(
      RepoSnapshot.fromJSON(response.body).branches.find((branchSnapshot) => branchName.equals(branchSnapshot.name))
        .revision,
      equalTo(this.lastCommitRevision)
    )
  }
)

Then('it should respond with {int} status', function (this: World, expectedStatus: number) {
  assertThat(this.lastResponse.status, equalTo(expectedStatus))
})

Then('it should respond with an error:', function (this: World, expectedMessage: string) {
  assertThat(this.lastResponse, not(isSuccess()))
  assertThat(this.lastResponse.text, equalTo(expectedMessage))
})

Then('the file should be in {BranchName} of the remote repo', async function (this: World, branchName: BranchName) {
  const git = await openBareRepo(this.remotePath(this.repoId))
  const files = await git(GetFiles.for(branchName))
  assertThat(files, contains(this.file))
})

Then(
  'the remote repo should have a new commit at the head of {BranchName}:',
  async function (this: World, branchName: BranchName, commitDetails: DataTable) {
    const branchRef = RefName.localBranch(branchName)
    const repo = new GitDirectory(this.remotePath(this.repoId))
    const lastCommit = await repo.read('cat-file', ['-p', branchRef.value])
    const row = commitDetails.hashes()[0]
    const author = new Author(new NameOfPerson(row['Author name']), new Email(row['Author email']))
    const message = CommitMessage.of(row['Commit message'])
    assertThat(lastCommit, containsString(author.toString()))
    assertThat(lastCommit, containsString(message.toString()))
  }
)

Then('the repo should have been fetched', async function (this: World) {
  // TODO: resolve duplication with the "fetched n times" step below
  await promiseThat(
    new Promise<void>((received) =>
      this.domainEvents.on('repo.fetched', (event) => event.repoId.equals(this.repoId) && received())
    ),
    fulfilled()
  )
})

Then('the events received by the consumer should be:', function (this: World, expectedEvents: string) {
  assertThat(this.events, equalTo(expectedEvents.split('\n')))
})

Then('the repo should be linked to that remote url', async function (this: World) {
  const response = await this.request.post(`/repos/${this.repoId}`).set('Accept', 'application/json')
  assertThat(response, isSuccess())
})

Then(
  'the consumer can read the contents of the file on {BranchName} of the local clone',
  async function (this: World, branchName: BranchName) {
    // TODO: use URI/template
    const response = await this.request.get(`/repos/${this.repoId}/commits/${branchName}/files/${this.file.path}`)
    assertThat(response.text, equalTo(this.file.content))
  }
)

Then('the consumer should be told to retry in {int} seconds', function (this: World, expectedRetrySeconds: number) {
  assertThat(this.lastResponse.headers['retry-after'], equalTo(expectedRetrySeconds.toString()))
})

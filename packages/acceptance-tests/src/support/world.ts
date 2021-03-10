import { Application, CommitName, DomainEventBus, GitFile, RemoteUrl, RepoId, WriteLogEvent } from 'git-en-boite-core'
import { Response, SuperTest, Test } from 'supertest'

export type World = {
  domainEvents: DomainEventBus
  log: WriteLogEvent
  repoId: RepoId
  anotherRepoId: RepoId
  lastCommitRevision: CommitName
  lastResponse: Response
  request: SuperTest<Test>
  events: string[]
  file: GitFile
  app: Application
  remoteUrl: (repoId: RepoId) => RemoteUrl
  remotePath: (repoId: RepoId) => string
  moveRemoteToPath: (oldRemotePath: string, newRemotePath: string) => void
}

import { Application, CommitName, DomainEventBus, GitFile, RepoId } from 'git-en-boite-core'
import { Response, SuperTest, Test } from 'supertest'

export type World = {
  domainEvents: DomainEventBus
  repoId: RepoId
  remoteRepoPath: string
  tmpDir: string
  lastCommitRevision: CommitName
  lastResponse: Response
  request: SuperTest<Test>
  events: string[]
  file: GitFile
  app: Application
}

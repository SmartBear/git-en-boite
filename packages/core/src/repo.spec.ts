import { EventEmitter } from 'events'
import { assertThat, containsInAnyOrder, fulfilled, isRejectedWith, promiseThat } from 'hamjest'
import { stubInterface } from 'ts-sinon'

import { BranchName, BranchSnapshot, GitRepo, Ref, RefName, Refs, Repo, RepoId } from '.'
import { CommitName } from './commit_name'
import { DomainEventBus } from './events'
import { RemoteUrl } from './remote_url'

describe(Repo.name, () => {
  const domainEvents: DomainEventBus = new EventEmitter()

  context('setting the origin', () => {
    it('returns as soon as the git command has completed', async () => {
      let finishGitConnect: () => void
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.returns(
        new Promise(resolve => {
          finishGitConnect = resolve
        }),
      )
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo, domainEvents)
      const connecting = repo.setOriginTo(RemoteUrl.of('a-remote-url'))
      finishGitConnect()
      await promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.rejects(new Error('Unable to connect'))
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo, domainEvents)
      await promiseThat(
        repo.setOriginTo(RemoteUrl.of('a-bad-url')),
        isRejectedWith(new Error('Unable to connect')),
      )
    })

    it('emits a `repo.origin-set` event', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('a-remote-url')
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.resolves()
      const repo = new Repo(repoId, gitRepo, domainEvents)
      const waitingForEvent = new Promise(received =>
        domainEvents.on(
          'repo.origin-set',
          event => event.repoId.equals(repoId) && event.remoteUrl.equals(remoteUrl) && received(),
        ),
      )
      repo.setOriginTo(remoteUrl)
      await promiseThat(waitingForEvent, fulfilled())
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.fetch.resolves()
      gitRepo.setOriginTo.resolves()
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo, domainEvents)
      await promiseThat(repo.setOriginTo(RemoteUrl.of('a-remote-url')), fulfilled())
    })

    it('emits a `repo.fetched` event', async () => {
      const repoId = RepoId.of('a-repo-id')
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.fetch.resolves()
      const repo = new Repo(repoId, gitRepo, domainEvents)
      const waitingForEvent = new Promise(received =>
        domainEvents.on('repo.fetched', event => event.repoId.equals(repoId) && received()),
      )
      repo.fetch()
      await promiseThat(waitingForEvent, fulfilled())
    })
  })

  context('listing branches', () => {
    it('returns a branch for each remote ref from origin', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.getRefs.resolves(
        new Refs(
          new Ref(CommitName.of('1'), RefName.fetchedFromOrigin(BranchName.of('main'))),
          new Ref(CommitName.of('2'), RefName.fetchedFromOrigin(BranchName.of('develop'))),
          new Ref(CommitName.of('3'), RefName.forPendingCommit(BranchName.of('develop'))),
          new Ref(
            CommitName.of('unlikely-this-would-happen'),
            RefName.localBranch(BranchName.of('test')),
          ),
        ),
      )
      const expectedBranches: BranchSnapshot[] = [
        new BranchSnapshot(BranchName.of('main'), CommitName.of('1')),
        new BranchSnapshot(BranchName.of('develop'), CommitName.of('2')),
      ]
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo, domainEvents)
      assertThat(await repo.branches(), containsInAnyOrder(...expectedBranches))
    })
  })
})

import { EventEmitter } from 'events'
import { assertThat, containsInAnyOrder, equalTo, fulfilled, isRejectedWith, promiseThat, rejected } from 'hamjest'
import { StubbedInstance, stubInterface } from 'ts-sinon'

import {
  BranchName,
  BranchSnapshot,
  CommitName,
  DomainEventBus,
  LocalClone,
  Ref,
  RefName,
  Refs,
  RemoteUrl,
  Repo,
  RepoId,
} from '.'

describe(Repo.name, () => {
  const domainEvents: DomainEventBus = new EventEmitter()

  context('setting the origin', () => {
    it('returns as soon as the git command has completed', async () => {
      let finishGitConnect: () => void
      const localClone = stubInterface<LocalClone>()
      localClone.setOriginTo.returns(
        new Promise((resolve) => {
          finishGitConnect = resolve
        })
      )
      const repo = new Repo(RepoId.of('a-repo-id'), localClone, domainEvents)
      const connecting = repo.setOriginTo(RemoteUrl.of('a-remote-url'))
      finishGitConnect()
      await promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', async () => {
      const localClone = stubInterface<LocalClone>()
      localClone.setOriginTo.rejects(new Error('Unable to connect'))
      const repo = new Repo(RepoId.of('a-repo-id'), localClone, domainEvents)
      await promiseThat(repo.setOriginTo(RemoteUrl.of('a-bad-url')), isRejectedWith(new Error('Unable to connect')))
    })

    it('emits a `repo.conected event', async () => {
      const repoId = RepoId.of('a-repo-id')
      const remoteUrl = RemoteUrl.of('a-remote-url')
      const localClone = stubInterface<LocalClone>()
      localClone.setOriginTo.resolves()
      const repo = new Repo(repoId, localClone, domainEvents)
      const waitingForEvent = new Promise<void>((received) =>
        domainEvents.on('repo.connected', (event) => event.repoId.equals(repoId) && received())
      )
      repo.setOriginTo(remoteUrl)
      await promiseThat(waitingForEvent, fulfilled())
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', async () => {
      const localClone = stubInterface<LocalClone>()
      localClone.fetch.resolves()
      localClone.setOriginTo.resolves()
      const repo = new Repo(RepoId.of('a-repo-id'), localClone, domainEvents)
      await promiseThat(repo.setOriginTo(RemoteUrl.of('a-remote-url')), fulfilled())
    })

    it('emits a `repo.fetched` event', async () => {
      const repoId = RepoId.of('a-repo-id')
      const localClone = stubInterface<LocalClone>()
      localClone.fetch.resolves()
      const repo = new Repo(repoId, localClone, domainEvents)
      const waitingForEvent = new Promise<void>((received) =>
        domainEvents.on('repo.fetched', (event) => event.repoId.equals(repoId) && received())
      )
      repo.fetch()
      await promiseThat(waitingForEvent, fulfilled())
    })

    context('when the fetch fails', async () => {
      const error = new Error('a git error')
      const repoId = RepoId.of('a-repo-id')
      let localClone: StubbedInstance<LocalClone>

      beforeEach(() => {
        localClone = stubInterface<LocalClone>()
        localClone.fetch.rejects(error)
      })

      it('rejects with the error', async () => {
        const repo = new Repo(repoId, localClone, domainEvents)
        await promiseThat(repo.fetch(), rejected(equalTo(error)))
      })

      it('emits a `repo.fetch-failed` event', async () => {
        const repo = new Repo(repoId, localClone, domainEvents)
        await promiseThat(repo.fetch(), rejected(equalTo(error)))
        const waitingForEvent = new Promise<void>((received) =>
          domainEvents.on(
            'repo.fetch-failed',
            (event) => event.repoId.equals(repoId) && event.error === error && received()
          )
        )
        repo.fetch().catch(() => {
          // expected
        })
        await promiseThat(waitingForEvent, fulfilled())
      })
    })
  })

  context('listing branches', () => {
    it('returns a branch for each remote ref from origin', async () => {
      const localClone = stubInterface<LocalClone>()
      localClone.getRefs.resolves(
        new Refs(
          new Ref(CommitName.of('1'), RefName.fetchedFromOrigin(BranchName.of('main'))),
          new Ref(CommitName.of('2'), RefName.fetchedFromOrigin(BranchName.of('develop'))),
          new Ref(CommitName.of('3'), RefName.forPendingCommit(BranchName.of('develop'))),
          new Ref(CommitName.of('unlikely-this-would-happen'), RefName.localBranch(BranchName.of('test')))
        )
      )
      const expectedBranches: BranchSnapshot[] = [
        new BranchSnapshot(BranchName.of('main'), CommitName.of('1')),
        new BranchSnapshot(BranchName.of('develop'), CommitName.of('2')),
      ]
      const repo = new Repo(RepoId.of('a-repo-id'), localClone, domainEvents)
      assertThat(await repo.branches(), containsInAnyOrder(...expectedBranches))
    })
  })
})

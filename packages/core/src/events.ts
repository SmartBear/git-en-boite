import { RepoId, BranchName } from '.'
import { RemoteUrl } from './remote_url'

type EventMap = Record<string, DomainEvent>
type EventKey<T extends EventMap> = string & keyof T
type EventHandler<T> = (params: T) => void

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventHandler<T[K]>): void
  off<K extends EventKey<T>>(eventName: K, fn: EventHandler<T[K]>): void
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void
}

class DomainEvent {
  public readonly occuredAt: Date
  constructor() {
    this.occuredAt = new Date()
  }
}

class RepoEvent extends DomainEvent {
  constructor(public readonly repoId: RepoId) {
    super()
  }
}

export class RepoBranchUpdated extends RepoEvent {
  constructor(public readonly branchName: BranchName, repoId: RepoId) {
    super(repoId)
  }
}

export class RepoOriginSet extends RepoEvent {
  constructor(public readonly remoteUrl: RemoteUrl, repoId: RepoId) {
    super(repoId)
  }
}

type DomainEvents = {
  'repo.branch-updated': RepoBranchUpdated
  'repo.origin-set': RepoOriginSet
}

export type DomainEventBus = Emitter<DomainEvents>

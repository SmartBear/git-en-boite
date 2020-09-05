import { RepoId, BranchName } from '.'
import { RemoteUrl } from './remote_url'

type EventMap = Record<string, DomainEvent>
type EventKey<T extends EventMap> = string & keyof T
type EventHandler<T> = (params: T) => void

interface EvenBus<Map extends EventMap> {
  on<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
  off<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
  emit<Key extends EventKey<Map>>(eventName: Key, params: Map[Key]): void
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

export class RepoFetched extends RepoEvent {}

export class RepoOriginSet extends RepoEvent {
  constructor(public readonly remoteUrl: RemoteUrl, repoId: RepoId) {
    super(repoId)
  }
}

type DomainEvents = {
  'repo.fetched': RepoFetched
  'repo.origin-set': RepoOriginSet
}

export type DomainEventBus = EvenBus<DomainEvents>

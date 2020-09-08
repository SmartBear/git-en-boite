import { RepoId } from '.'

type EventMap = Record<string, DomainEvent>
type EventKey<T extends EventMap> = string & keyof T
type EventHandler<T> = (params: T) => void

interface EventBus<Map extends EventMap> {
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

export class RepoEvent extends DomainEvent {
  constructor(public readonly repoId: RepoId) {
    super()
  }
}

type DomainEvents = {
  'repo.fetched': RepoEvent
  'repo.connected': RepoEvent
}

export type DomainEventBus = EventBus<DomainEvents>

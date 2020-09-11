import { RepoId } from '.'
import { EntityId } from './entity_id'

type HasTypeProperty<Map> = { [Key in keyof Map]: { type: Key } }
type DomainEventMap = EventMap<DomainEvent> & HasTypeProperty<EventMap<DomainEvent>>
type EventMap<Event> = Record<string, Event>
type EventKey<Map extends DomainEventMap> = string & keyof Map
type EventHandler<Event> = (params: Event) => void

interface PublishesEvents<Map extends DomainEventMap> {
  emit<Key extends EventKey<Map>>(eventName: Key, params: Map[Key]): void
}

interface SubscribesToEvents<Map extends DomainEventMap> {
  on<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
  off<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
}

type DomainEvent = {
  readonly entityId: EntityId
  readonly occuredAt: Date
  readonly type: EventKey<DomainEventMap>
}

export abstract class DomainEventBase implements DomainEvent {
  public readonly occuredAt: Date

  constructor(public readonly entityId: EntityId) {
    this.occuredAt = new Date()
  }

  abstract get type(): EventKey<DomainEventMap>
}

export abstract class RepoEvent extends DomainEventBase {
  constructor(public readonly repoId: RepoId) {
    super(repoId)
  }
}

export class RepoFetched extends RepoEvent {
  public readonly type = 'repo.fetched'
}
export class RepoConnected extends RepoEvent {
  public readonly type = 'repo.connected'
}

// Utility types for creating a type-checked exhaustive list of the keys in a type at runtime
// See https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-654906323
type ValueOf<T> = T[keyof T]
type NonEmptyArray<T> = [T, ...T[]]
type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never
const enumerate = <T>() => <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) => elements

type RepoEvents = {
  'repo.fetched': RepoFetched
  'repo.connected': RepoConnected
}
export type DomainEvents = RepoEvents
export const DomainEvents = {
  keys: enumerate<keyof DomainEvents>()('repo.fetched', 'repo.connected'),
}

export type PublishesDomainEvents = PublishesEvents<DomainEvents>
export type SubscribesToDomainEvents = SubscribesToEvents<DomainEvents>
export type DomainEventBus = PublishesDomainEvents & SubscribesToDomainEvents

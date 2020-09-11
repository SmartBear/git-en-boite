import { RepoId } from '.'
import { EntityId } from './entity_id'

type EventMap = Record<string, DomainEvent>
type EventKey<T extends EventMap> = string & keyof T
type EventHandler<T> = (params: T) => void

interface PublishesEvents<Map extends EventMap> {
  emit<Key extends EventKey<Map>>(eventName: Key, params: Map[Key]): void
}

interface SubscribesToEvents<Map extends EventMap> {
  on<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
  off<Key extends EventKey<Map>>(eventName: Key, fn: EventHandler<Map[Key]>): void
}

export class DomainEvent {
  public readonly occuredAt: Date

  constructor(public readonly entityId: EntityId) {
    this.occuredAt = new Date()
  }
}

export class RepoEvent extends DomainEvent {
  constructor(public readonly repoId: RepoId) {
    super(repoId)
  }
}

// Utility types for creating a type-checked exhaustive list of the keys in a type at runtime
// See https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-654906323
type ValueOf<T> = T[keyof T]
type NonEmptyArray<T> = [T, ...T[]]
type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never
const enumerate = <T>() => <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) => elements

type RepoEvents = {
  'repo.fetched': RepoEvent
  'repo.connected': RepoEvent
}
export type DomainEvents = RepoEvents
export const DomainEvents = {
  keys: enumerate<keyof DomainEvents>()('repo.fetched', 'repo.connected'),
}

export type PublishesDomainEvents = PublishesEvents<DomainEvents>
export type SubscribesToDomainEvents = SubscribesToEvents<DomainEvents>
export type DomainEventBus = PublishesDomainEvents & SubscribesToDomainEvents

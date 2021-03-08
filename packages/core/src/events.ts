import { ensure, isString, JSONObject, JSONValue, TinyType, TinyTypeOf } from 'tiny-types'

import { RepoId } from '.'
import { EntityId } from './entity_id'
import { AccessDenied } from './errors'
import { asSerializedError, buildDeserializeError } from './serialize_errors'

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

const isEventKey = (candidate: unknown): candidate is EventKey<DomainEvents> =>
  !!DomainEvents.keys.find((key) => key === candidate)

export abstract class DomainEvent extends TinyType {
  constructor(public readonly entityId: EntityId, public readonly occurredAt: Timestamp = Timestamp.now()) {
    super()
  }
  abstract get type(): EventKey<DomainEvents>
}

export const fromJSON = (payload: JSONObject): DomainEvent => {
  const eventKey = payload.type
  if (!isEventKey(eventKey)) {
    throw new CannotDeserializeEvent(payload)
  }
  // TODO: figure out how to use the type system to check we're covering all the types correctly here
  if (eventKey === 'repo.fetched') return RepoFetched.fromJSON(payload)
  if (eventKey === 'repo.connected') return RepoConnected.fromJSON(payload)
  if (eventKey === 'repo.fetch-failed') return RepoFetchFailed.fromJSON(payload)
}

export class Timestamp extends TinyTypeOf<Date>() {
  static fromJSON(json: JSONValue): Timestamp {
    ensure('Timestamp', json, isString())
    return new Timestamp(new Date(Date.parse(json as string)))
  }

  static now(): Timestamp {
    return new Timestamp(new Date())
  }
}

export class CannotDeserializeEvent extends Error {
  constructor(payload: JSONValue) {
    super(`Cannot deserialize event from payload: ${JSON.stringify(payload)}`)
  }
}
export abstract class RepoEvent extends DomainEvent {
  constructor(public readonly repoId: RepoId, occuredAt?: Timestamp) {
    super(repoId, occuredAt)
  }
}

export class RepoFetched extends RepoEvent {
  public readonly type = 'repo.fetched'

  static fromJSON(payload: JSONObject): RepoFetched {
    const repoId = RepoId.fromJSON(payload.repoId)
    const occurredAt = Timestamp.fromJSON(payload.occurredAt)
    return new RepoFetched(repoId, occurredAt)
  }
}

const deserialize = buildDeserializeError(Error, AccessDenied)

export class RepoFetchFailed extends RepoEvent {
  public readonly type = 'repo.fetch-failed'

  constructor(public readonly error: Error, repoId: RepoId, occuredAt?: Timestamp) {
    super(repoId, occuredAt)
  }

  static fromJSON(payload: JSONObject): RepoFetchFailed {
    const repoId = RepoId.fromJSON(payload.repoId)
    const occurredAt = Timestamp.fromJSON(payload.occurredAt)
    const error = deserialize(new Error(payload.errorMessage as string), console.error)
    return new RepoFetchFailed(error, repoId, occurredAt)
  }

  public toJSON(): JSONObject {
    return {
      type: this.type,
      occurredAt: this.occurredAt.toJSON(),
      repoId: this.repoId.toJSON(),
      errorMessage: asSerializedError(this.error).message,
    }
  }
}

export class RepoConnected extends RepoEvent {
  public readonly type = 'repo.connected'

  static fromJSON(payload: JSONObject): RepoConnected {
    const repoId = RepoId.fromJSON(payload.repoId)
    const occurredAt = Timestamp.fromJSON(payload.occurredAt)
    return new RepoConnected(repoId, occurredAt)
  }
}

// Utility types for creating a type-checked exhaustive list of the keys in a type at runtime
// See https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-654906323
type ValueOf<T> = T[keyof T]
type NonEmptyArray<T> = [T, ...T[]]
type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never
const enumerate = <T>() => <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) => elements

export type DomainEvents = {
  'repo.fetched': RepoFetched
  'repo.fetch-failed': RepoFetchFailed
  'repo.connected': RepoConnected
}
export const DomainEvents = {
  keys: enumerate<keyof DomainEvents>()('repo.fetched', 'repo.fetch-failed', 'repo.connected'),
}

export type PublishesDomainEvents = PublishesEvents<DomainEvents>
export type SubscribesToDomainEvents = SubscribesToEvents<DomainEvents>
export type DomainEventBus = PublishesDomainEvents & SubscribesToDomainEvents

import { JSONObject, TinyType } from 'tiny-types'

import { EntityId, RepoId } from '..'
import { asSerializedError } from '../serialize_errors'
import { deserializeError } from './deserializeError'
import { enumerate } from './enumerate'
import { PublishesEvents, SubscribesToEvents } from './EventMap'
import { Timestamp } from './Timestamp'
export * from './fromJSON'

export abstract class DomainEvent extends TinyType {
  constructor(public readonly entityId: EntityId, public readonly occurredAt: Timestamp = Timestamp.now()) {
    super()
  }
  abstract get type(): keyof DomainEvents
}

export abstract class RepoEvent extends DomainEvent {
  constructor(public readonly repoId: RepoId, occuredAt?: Timestamp) {
    super(repoId, occuredAt)
  }
}

export class RepoFetched extends RepoEvent {
  public readonly type = 'repo.fetched'

  static fromJSON(payload: JSONObject): RepoFetched {
    return new RepoFetched(RepoId.fromJSON(payload.repoId), Timestamp.fromJSON(payload.occurredAt))
  }
}

export class RepoFetchFailed extends RepoEvent {
  public readonly type = 'repo.fetch-failed'

  constructor(public readonly error: Error, repoId: RepoId, occuredAt?: Timestamp) {
    super(repoId, occuredAt)
  }

  static fromJSON(payload: JSONObject): RepoFetchFailed {
    const repoId = RepoId.fromJSON(payload.repoId)
    const occurredAt = Timestamp.fromJSON(payload.occurredAt)
    const error = deserializeError(new Error(payload.errorMessage as string), console.error)
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
    return new RepoConnected(RepoId.fromJSON(payload.repoId), Timestamp.fromJSON(payload.occurredAt))
  }
}

export type DomainEvents = {
  'repo.fetched': RepoFetched
  'repo.fetch-failed': RepoFetchFailed
  'repo.connected': RepoConnected
}
export const DomainEvents = {
  keys: enumerate<keyof DomainEvents>()('repo.fetched', 'repo.fetch-failed', 'repo.connected'),
}

export type PublishesDomainEvents = PublishesEvents<DomainEvent, DomainEvents>
export type SubscribesToDomainEvents = SubscribesToEvents<DomainEvent, DomainEvents>
export type DomainEventBus = PublishesDomainEvents & SubscribesToDomainEvents

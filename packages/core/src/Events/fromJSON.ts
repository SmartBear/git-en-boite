import { JSONObject, JSONValue } from 'tiny-types'

import { DomainEvent, DomainEvents, EventName, RepoConnected, RepoFetched, RepoFetchFailed, RepoReconnected } from '.'

export class CannotDeserializeEvent extends Error {
  constructor(payload: JSONValue) {
    super(`Cannot deserialize event from payload: ${JSON.stringify(payload)}`)
  }
}

const isEventName = (candidate: unknown): candidate is EventName =>
  !!DomainEvents.names.find((key) => key === candidate)

export function fromJSON(payload: JSONObject): DomainEvent {
  const eventName = payload.type
  if (!isEventName(eventName)) {
    throw new CannotDeserializeEvent(payload)
  }

  interface DomainEventConstructor<T extends DomainEvent> {
    new (...args: never[]): T
    fromJSON(payload: JSONObject): T
  }

  const constructor: { [Key in EventName]: DomainEventConstructor<DomainEvents[Key]> } = {
    'repo.fetched': RepoFetched,
    'repo.connected': RepoConnected,
    'repo.reconnected': RepoReconnected,
    'repo.fetch-failed': RepoFetchFailed,
  }
  return constructor[eventName].fromJSON(payload)
}

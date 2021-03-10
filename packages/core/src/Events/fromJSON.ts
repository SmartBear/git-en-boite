import { JSONObject, JSONValue } from 'tiny-types'

import { DomainEvent, DomainEvents, RepoConnected, RepoFetched, RepoFetchFailed } from '.'

export class CannotDeserializeEvent extends Error {
  constructor(payload: JSONValue) {
    super(`Cannot deserialize event from payload: ${JSON.stringify(payload)}`)
  }
}

export const isEventKey = (candidate: unknown): candidate is keyof DomainEvents =>
  !!DomainEvents.keys.find((key) => key === candidate)

export function fromJSON(payload: JSONObject): DomainEvent {
  const eventName = payload.type
  if (!isEventKey(eventName)) {
    throw new CannotDeserializeEvent(payload)
  }

  interface DomainEventConstructor<T extends DomainEvent> {
    new (...args: never[]): T
    fromJSON(payload: JSONObject): T
  }

  const constructor: { [Key in keyof DomainEvents]: DomainEventConstructor<DomainEvents[Key]> } = {
    'repo.fetched': RepoFetched,
    'repo.connected': RepoConnected,
    'repo.fetch-failed': RepoFetchFailed,
  }
  return constructor[eventName].fromJSON(payload)
}

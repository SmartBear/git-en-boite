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
  const eventKey = payload.type
  if (!isEventKey(eventKey)) {
    throw new CannotDeserializeEvent(payload)
  }
  // TODO: figure out how to use the type system to check we're covering all the types correctly here
  if (eventKey === 'repo.fetched') return RepoFetched.fromJSON(payload)
  if (eventKey === 'repo.connected') return RepoConnected.fromJSON(payload)
  if (eventKey === 'repo.fetch-failed') return RepoFetchFailed.fromJSON(payload)
}

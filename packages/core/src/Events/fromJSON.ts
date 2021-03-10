import { JSONObject, JSONValue } from 'tiny-types'

import { DomainEvent, DomainEvents } from '.'
import { DomainEventConstructor } from './DomainEventConstructor'

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

  return DomainEventConstructor[eventName].fromJSON(payload)
}

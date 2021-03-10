import { DomainEvents, DomainRule, WriteLogEvent } from 'git-en-boite-core'

export const logDomainEvents = (log: WriteLogEvent): DomainRule => (events) => {
  for (const eventKey of DomainEvents.keys) {
    events.on(eventKey, (event) => log({ level: 'info', message: eventKey, event }))
  }
}

import { DomainEvents, DomainRule, WriteLogEvent } from 'git-en-boite-core'

export const logDomainEvents = (log: WriteLogEvent): DomainRule => (events) => {
  for (const eventName of DomainEvents.names) {
    events.on(eventName, (event) => log({ level: 'info', message: eventName, event }))
  }
}

import { WriteLogEvent } from '../Logging'
import { CommandsApplication, SubscribesToDomainEvents } from '..'

export type DomainRule = (
  domainEvents: SubscribesToDomainEvents,
  app: CommandsApplication,
  log: WriteLogEvent,
) => void

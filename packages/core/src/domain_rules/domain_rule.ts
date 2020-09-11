import { CommandsApplication, SubscribesToDomainEvents, Logger } from '..'

export type DomainRule = (
  domainEvents: SubscribesToDomainEvents,
  app: CommandsApplication,
  logger: Logger,
) => void

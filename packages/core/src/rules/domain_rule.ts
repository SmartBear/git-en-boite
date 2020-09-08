import { CommandsApplication, SubscribesToDomainEvents } from '..'

export type DomainRule = (domainEvents: SubscribesToDomainEvents, app: CommandsApplication) => void

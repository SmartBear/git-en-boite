import { DomainEventBus, CommandsApplication } from '..'

export type DomainRule = (domainEvents: DomainEventBus, app: CommandsApplication) => void

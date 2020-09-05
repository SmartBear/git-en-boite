import { DomainEventBus, CommandsApplication } from '..'

export type Rule = (domainEvents: DomainEventBus, app: CommandsApplication) => void

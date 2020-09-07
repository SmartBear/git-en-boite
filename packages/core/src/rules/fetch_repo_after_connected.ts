import { DomainEventBus } from '../events'
import { CommandsApplication } from '..'
import { Rule } from './rule'

export const fetchRepoAfterConnected: Rule = (
  domainEvents: DomainEventBus,
  app: CommandsApplication,
) => domainEvents.on('repo.connected', ({ repoId }) => app.fetchFromRemote(repoId))

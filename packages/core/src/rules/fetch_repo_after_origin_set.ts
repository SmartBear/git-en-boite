import { DomainEventBus } from '../events'
import { CommandsApplication } from '..'
import { Rule } from './rule'

export const fetchRepoAfterOriginSet: Rule = (
  domainEvents: DomainEventBus,
  app: CommandsApplication,
) => domainEvents.on('repo.origin-set', ({ repoId }) => app.fetchFromRemote(repoId))

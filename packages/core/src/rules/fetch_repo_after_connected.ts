import { DomainEventBus } from '../events'
import { CommandsApplication } from '..'
import { DomainRule } from '.'

export const fetchRepoAfterConnected: DomainRule = (
  domainEvents: DomainEventBus,
  app: CommandsApplication,
) => domainEvents.on('repo.connected', ({ repoId }) => app.fetchFromRemote(repoId))

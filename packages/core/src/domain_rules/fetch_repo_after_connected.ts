import { DomainRule } from '.'

export const fetchRepoAfterConnected: DomainRule = (domainEvents, app) =>
  domainEvents.on('repo.connected', ({ repoId }) => app.fetchFromRemote(repoId))

import { DomainRule } from '.'

export const fetchRepoAfterConnected: DomainRule = (domainEvents, app, logger) =>
  domainEvents.on('repo.connected', ({ repoId }) =>
    app.fetchFromRemote(repoId).catch(error => logger.error(error)),
  )

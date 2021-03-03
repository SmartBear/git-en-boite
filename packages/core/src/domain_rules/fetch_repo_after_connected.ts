import { DomainRule } from '.'

export const fetchRepoAfterConnected: DomainRule = (domainEvents, app, log) =>
  domainEvents.on('repo.connected', ({ repoId }) =>
    app.fetchFromRemote(repoId).catch(error => log({ level: 'warn', ...error })),
  )

import { JSONObject } from 'tiny-types'
import { DomainEvent, DomainEvents, RepoConnected, RepoFetched, RepoFetchFailed } from './index'

export interface DomainEventConstructor<T extends DomainEvent> {
  new (...args: never[]): T
  fromJSON(payload: JSONObject): T
}

export const DomainEventConstructor: { [Key in keyof DomainEvents]: DomainEventConstructor<DomainEvents[Key]> } = {
  'repo.fetched': RepoFetched,
  'repo.connected': RepoConnected,
  'repo.fetch-failed': RepoFetchFailed,
}

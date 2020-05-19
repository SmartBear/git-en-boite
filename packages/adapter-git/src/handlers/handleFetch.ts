import { Fetch } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleFetch: Handler<Fetch> = async function handleFetch(repo) {
  await repo.execGit('fetch', 'origin')
}

import { Fetch } from 'git-en-boite-git-port'

import { Handler } from './handler'

export const handleFetch: Handler<Fetch> = async repo => {
  await repo.execGit('fetch', ['origin'])
}

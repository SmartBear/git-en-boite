import { SetOrigin } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleSetOrigin: Handler<SetOrigin> = async (repo, { url }) => {
  await repo.execGit('remote', 'add', 'origin', url)
}

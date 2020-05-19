import { Init } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleInit: Handler<Init> = async function handleInit(repo, command) {
  await repo.execGit('init', ...(command.isBare ? ['--bare'] : []))
  await repo.execGit('config', 'gc.auto', '0')
  await repo.execGit('config', 'gc.pruneExpire', 'never') // don't prune objects if GC runs
}

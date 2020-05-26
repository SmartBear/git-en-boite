import { Init } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleInit: Handler<Init> = async (repo, command) => {
  await repo.execGit('init', command.isBare ? ['--bare'] : [])
  await repo.execGit('config', ['gc.auto', '0'])
  await repo.execGit('config', ['gc.pruneExpire', 'never']) // don't prune objects if GC runs
  await repo.execGit('config', ['user.name', 'Git en boîte'])
  await repo.execGit('config', ['user.email', 'git-en-boite-devs@smartbear.com'])
}

import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Init } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleInit: Handle<GitDirectory, AsyncCommand<Init>> = async repo => {
  await repo.exec('init', ['--bare'])
  await repo.exec('config', ['gc.auto', '0'])
  await repo.exec('config', ['gc.pruneExpire', 'never']) // don't prune objects if GC runs
  await repo.exec('config', ['user.name', 'Git en boîte'])
  await repo.exec('config', ['user.email', 'git-en-boite-devs@smartbear.com'])
}

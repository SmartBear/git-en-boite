import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Checkout } from 'git-en-boite-git-port'
import { GitDirectory } from '../git_directory'

export const handleCheckout: Handle<GitDirectory, AsyncCommand<Checkout>> = async (
  repo,
  { branchName },
) => {
  await repo.execGit('checkout', [branchName])
}

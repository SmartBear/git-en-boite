import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Checkout } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleCheckout: Handle<GitDirectory, AsyncCommand<Checkout>> = async (
  repo,
  { branchName },
) => {
  await repo.exec('checkout', [branchName])
}

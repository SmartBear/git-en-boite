import { Checkout } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleCheckout: Handler<Checkout> = async (repo, { branchName }) => {
  await repo.execGit('checkout', [branchName])
}

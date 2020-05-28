import { Checkout } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleCheckout: HandlesGitOperations<Checkout> = async (repo, { branchName }) => {
  await repo.execGit('checkout', [branchName])
}

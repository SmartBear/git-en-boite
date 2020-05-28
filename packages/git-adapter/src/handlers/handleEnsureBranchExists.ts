import { EnsureBranchExists } from 'git-en-boite-git-port'
import { HandlesGitOperations } from './handles_git_operations'

export const handleEnsureBranchExists: HandlesGitOperations<EnsureBranchExists> = async (
  repo,
  { name },
) => {
  const branches: string[] = await (
    await repo.execGit('branch', ['--list', '--format=%(refname:short)'])
  ).stdout
    .trim()
    .split('\n')
  if (!branches.includes(name)) await repo.execGit('branch', [name, 'HEAD'])
  // await repo.execGit('checkout', [name])
}

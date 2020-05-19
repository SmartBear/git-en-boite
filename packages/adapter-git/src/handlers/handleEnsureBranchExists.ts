import { EnsureBranchExists } from 'git-en-boite-core-port-git'
import { Handler } from './handler'

export const handleEnsureBranchExists: Handler<EnsureBranchExists> = async (repo, { name }) => {
  const branches: string[] = await (
    await repo.execGit('branch', '--list', '--format=%(refname:short)')
  ).stdout
    .trim()
    .split('\n')
  if (!branches.includes(name)) await repo.execGit('branch', name, 'HEAD')
}

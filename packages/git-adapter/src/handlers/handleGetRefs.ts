import { GetRefs } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'
import { Ref } from 'git-en-boite-core'

export const handleGetRefs: HandlesGitOperations<GetRefs, Ref[]> = async repo => {
  const { stdout } = await repo.execGit('show-ref')
  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim().split(' '))
    .map(([revision, name]) => new Ref(revision, name))
}

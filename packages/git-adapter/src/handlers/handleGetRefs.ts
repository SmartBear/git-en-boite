import { GetRefs } from 'git-en-boite-git-port'

import { Handler } from './handler'
import { Ref } from 'git-en-boite-core'

export const handleGetRefs: Handler<GetRefs, Ref[]> = async repo => {
  const { stdout } = await repo.execGit('show-ref')
  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim().split(' '))
    .map(([revision, name]) => new Ref(revision, name))
}

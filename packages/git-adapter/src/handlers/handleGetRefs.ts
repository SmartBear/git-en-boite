import { AsyncQuery, Handle } from 'git-en-boite-command-bus'
import { Ref } from 'git-en-boite-core'
import { GetRefs } from 'git-en-boite-git-port'
import { GitDirectory } from 'git_directory'

export const handleGetRefs: Handle<GitDirectory, AsyncQuery<GetRefs, Ref[]>> = async repo => {
  const { stdout } = await repo.execGit('show-ref')
  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim().split(' '))
    .map(([revision, name]) => new Ref(revision, name))
}

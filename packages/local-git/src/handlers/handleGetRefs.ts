import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { Ref, RefName } from 'git-en-boite-core'
import { GetRefs } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetRefs: Handle<GitDirectory, AsyncQuery<GetRefs, Ref[]>> = async repo => {
  try {
    const { stdout } = await repo.exec('show-ref')
    return stdout
      .trim()
      .split('\n')
      .map(line => line.trim().split(' '))
      .map(([revision, name]) => new Ref(revision, new RefName(name)))
  } catch (error) {
    return []
  }
}

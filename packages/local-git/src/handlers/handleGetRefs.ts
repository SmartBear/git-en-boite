import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { Ref, RefName, Refs, CommitName } from 'git-en-boite-core'
import { GetRefs } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetRefs: Handle<GitDirectory, AsyncQuery<GetRefs, Refs>> = async repo => {
  try {
    const output = await repo.read('show-ref')
    return new Refs(
      ...output
        .split('\n')
        .map(line => line.trim().split(' '))
        .map(([revision, name]) => new Ref(CommitName.of(revision), RefName.parse(name))),
    )
  } catch (error) {
    // TODO: only wrap the git call in the error handler so we don't swallow errors parsing the git output
    return new Refs()
  }
}

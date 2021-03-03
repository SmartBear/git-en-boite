import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { Ref, RefName, Refs, CommitName } from 'git-en-boite-core'
import { GetRefs } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetRefs: Handle<GitDirectory, AsyncQuery<GetRefs, Refs>> = async repo => {
  return new Refs(...(await showRef()).map(parse))
  async function showRef() {
    // An error is expected here if there are no commits in the repo yet
    try {
      return (await repo.read('show-ref')).split('\n')
    } catch {
      return []
    }
  }
}

const parse = (line: string): Ref => {
  const [revision, name] = line.trim().split(' ')
  return new Ref(CommitName.of(revision), RefName.parse(name))
}

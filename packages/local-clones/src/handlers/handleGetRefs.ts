import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { Ref, RefName, Refs, CommitName } from 'git-en-boite-core'
import { GetRefs } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetRefs: Handle<GitDirectory, AsyncQuery<GetRefs, Refs>> = async repo => {
  let output: string
  try {
    output = await repo.read('show-ref')
  } catch (error) {
    return new Refs()
  }
  return new Refs(...output.split('\n').map(parse))
}

const parse = (line: string): Ref => {
  const [revision, name] = line.trim().split(' ')
  return new Ref(CommitName.of(revision), RefName.parse(name))
}

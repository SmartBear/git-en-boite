import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { ShowFile } from '../operations'
import { GitDirectory } from '../git_directory'
import { FileContent } from 'git-en-boite-core'

export const handleShowFile: Handle<GitDirectory, AsyncQuery<ShowFile, FileContent>> = async (
  repo: GitDirectory,
  { ref, location }
) => {
  const content = await repo.read('show', [`${ref}:${location}`])
  return new FileContent(content)
}

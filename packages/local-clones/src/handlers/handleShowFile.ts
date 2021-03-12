import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { ShowFile } from '../operations'
import { GitDirectory } from '../git_directory'
import { FileContent } from 'git-en-boite-core'

export const handleShowFile: Handle<GitDirectory, AsyncQuery<ShowFile, FileContent>> = async (
  repo: GitDirectory,
  { ref, location }
) => {
  // TODO: Do we want to handle branch as well as commit shas?
  // If yes, we need to remember to check the remote refs because
  // fetch does not update the local ones.
  const content = await repo.read('show', [`${ref}:${location}`])
  return new FileContent(content)
}

import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { ShowFile } from '../operations'
import { GitDirectory } from '../git_directory'
import { FileContent, FileNotFound, UnknownFileContent } from 'git-en-boite-core'

export const handleShowFile: Handle<GitDirectory, AsyncQuery<ShowFile, FileContent>> = async (
  repo: GitDirectory,
  { ref, location }
) => {
  try {
    const content = await repo.read('show', [`${ref}:${location}`])
    return new FileContent(content)
  } catch (error) {
    if (error instanceof FileNotFound) {
      return new UnknownFileContent(`Could not find file "${location}" at "${ref}"`)
    } else {
      throw error
    }
  }
}

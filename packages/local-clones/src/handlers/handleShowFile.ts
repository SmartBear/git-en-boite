import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { ShowFile } from '../operations'
import { GitDirectory } from '../git_directory'
import { FileContent } from 'git-en-boite-core'

export const handleShowFile: Handle<GitDirectory, AsyncQuery<ShowFile, FileContent>> = async (
  repo: GitDirectory,
  { ref, location }
) => {
  return new FileContent('Feature: FINISH THIS')
}

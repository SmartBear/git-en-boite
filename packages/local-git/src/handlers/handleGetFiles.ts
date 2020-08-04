import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { File } from 'git-en-boite-core'
import { GetFiles } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleGetFiles: Handle<GitDirectory, AsyncQuery<GetFiles, File[]>> = async repo => {
  // try {
  //   const { stdout } = await repo.execGit('show-ref')
  //   return stdout
  //     .trim()
  //     .split('\n')
  //     .map(line => line.trim().split(' '))
  //     .map(([revision, name]) => new File(revision, name))
  // } catch (error) {
  //   return []
  // }
  return []
}

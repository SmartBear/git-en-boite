import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Commit } from '../operations'
import { GitDirectory } from '../git_directory'
import fs from 'fs'
import { promisify } from 'util'
import path from 'path'

const unlink = promisify(fs.unlink)

export const handleCommitToBareRepo: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, branchName },
) => {
  try {
    await unlink(path.resolve(repo.path, 'index'))
  } catch (err) {}

  for (const file of files) {
    const objectId = (
      await repo.execGit('hash-object', ['-w', '--stdin'], { stdin: file.content })
    ).stdout.trim()
    await repo.execGit('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
  }
  const treeName = (await repo.execGit('write-tree', [])).stdout.trim()
  const commitOptions = [treeName, '-m', message]

  try {
    const parentCommitName = (
      await repo.execGit('show-ref', ['--hash', `refs/heads/${branchName}`])
    ).stdout.trim()
    commitOptions.push('-p', parentCommitName)
  } catch (err) {}

  const commitName = (await repo.execGit('commit-tree', commitOptions)).stdout.trim()
  await repo.execGit('update-ref', [`refs/heads/${branchName}`, commitName], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

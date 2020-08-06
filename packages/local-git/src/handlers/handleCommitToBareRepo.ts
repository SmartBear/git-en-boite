import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Commit } from '../operations'
import { GitDirectory } from '../git_directory'
import fs from 'fs'
import path from 'path'

export const handleCommitToBareRepo: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, branchName },
) => {
  //TODO: Figure out how to ensure the staging area is empty.
  for (const file of files) {
    const filePath = path.resolve(repo.path, file.path)
    await fs.promises.writeFile(filePath, file.content)
    const objectId = (await repo.execGit('hash-object', ['-w', filePath])).stdout.trim()
    await repo.execGit('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
  }
  const treeName = (await repo.execGit('write-tree', [])).stdout.trim()
  const commitName = (await repo.execGit('commit-tree', [treeName, '-m', message])).stdout.trim()
  await repo.execGit('update-ref', [`refs/heads/${branchName}`, commitName], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

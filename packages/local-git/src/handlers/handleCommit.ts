import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'
import { Author } from 'git-en-boite-core'

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, branchName },
) => {
  for (const file of files) await repo.addFileToIndex(file)
  await commitCurrentIndexToBranch(repo, message, branchName, author)
  await repo.clearIndex()
}

async function commitCurrentIndexToBranch(
  repo: GitDirectory,
  message: string,
  branchName: string,
  author: Author,
) {
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

import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'
import { Author } from 'git-en-boite-core'

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, refName, branchName },
): Promise<void> => {
  await repo.clearIndex()
  for (const file of files) await repo.addFileToIndex(file)
  const commitName = await commitCurrentIndex(repo, message, branchName, author)
  await updateRef(repo, refName, commitName)
}

async function commitCurrentIndex(
  repo: GitDirectory,
  message: string,
  branchName: string,
  author: Author,
): Promise<string> {
  const treeName = (await repo.execGit('write-tree', [])).stdout.trim()
  const commitOptions = [treeName, '-m', message]

  try {
    const parentCommitName = (
      await repo.execGit('show-ref', ['--hash', `refs/remotes/origin/${branchName}`])
    ).stdout.trim()
    commitOptions.push('-p', parentCommitName)
  } catch (err) {}
  const commitName = (
    await repo.execGit('commit-tree', commitOptions, {
      env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
    })
  ).stdout.trim()

  return commitName
}

async function updateRef(repo: GitDirectory, refName: string, commitName: string) {
  await repo.execGit('update-ref', [refName, commitName])
}

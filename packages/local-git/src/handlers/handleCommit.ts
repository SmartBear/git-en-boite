import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, refName, branchName },
): Promise<void> => {
  await repo.execGit('read-tree', ['--empty'])

  const commitOptions = ['-m', message]

  try {
    const parentCommitName = (
      await repo.execGit('show-ref', ['--hash', `refs/remotes/origin/${branchName}`])
    ).stdout.trim()
    commitOptions.push('-p', parentCommitName)

    await repo.execGit('read-tree', [parentCommitName])
  } catch (err) {}

  for (const file of files) {
    const objectId = (
      await repo.execGit('hash-object', ['-w', '--stdin'], { stdin: file.content })
    ).stdout.trim()
    await repo.execGit('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
  }

  commitOptions.unshift((await repo.execGit('write-tree', [])).stdout.trim())

  const commitName = (
    await repo.execGit('commit-tree', commitOptions, {
      env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
    })
  ).stdout.trim()

  await updateRef(repo, refName, commitName)
}

async function updateRef(repo: GitDirectory, refName: string, commitName: string) {
  await repo.execGit('update-ref', [refName, commitName])
}

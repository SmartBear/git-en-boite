import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'
import { IGitExecutionOptions } from 'dugite'

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { files, message, author, refName, branchName },
): Promise<void> => {
  const commitArgs = ['-m', message]

  await repo.execGit('read-tree', ['--empty'])

  try {
    const parentCommitName = await read('show-ref', ['--hash', `refs/remotes/origin/${branchName}`])
    await repo.execGit('read-tree', [parentCommitName])

    commitArgs.push('-p', parentCommitName)
  } catch (err) {}

  for (const file of files) {
    const objectId = await read('hash-object', ['-w', '--stdin'], { stdin: file.content })
    await repo.execGit('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
  }

  const treeName = await read('write-tree')
  const commitName = await read('commit-tree', [treeName, ...commitArgs], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })

  await repo.execGit('update-ref', [refName, commitName])

  async function read(
    cmd: string,
    args: string[] = [],
    options?: IGitExecutionOptions,
  ): Promise<string> {
    return (await repo.execGit(cmd, args, options)).stdout.trim()
  }
}

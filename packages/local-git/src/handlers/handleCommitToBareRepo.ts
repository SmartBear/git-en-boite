import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Commit } from '../operations'
import { GitDirectory } from '../git_directory'

export const handleCommitToBareRepo: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { message, author, branchName },
) => {
  //TODO: Figure out how to ensure the staging area is empty.
  const treeName = (await repo.execGit('write-tree', [])).stdout.trim()
  const commitName = (await repo.execGit('commit-tree', [treeName, '-m', message])).stdout.trim()
  await repo.execGit('update-ref', [`refs/heads/${branchName}`, commitName], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
}

import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { Commit } from '../operations'
import { GitDirectory } from '../git_directory'
import { dirSync } from 'tmp'

export const handleCommitToBareRepo: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { message, author, branchName },
) => {
  const worktreePath = dirSync().name
  await repo.execGit('worktree', ['add', worktreePath, branchName, '--force'])
  const workingTree = new GitDirectory(worktreePath)
  await workingTree.execGit('commit', ['--allow-empty', '-m', message], {
    env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
  })
  await repo.execGit('worktree', ['remove', worktreePath])
}

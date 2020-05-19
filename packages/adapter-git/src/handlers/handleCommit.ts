import { Commit } from 'git-en-boite-core-port-git'

import { Handler } from './handler'

export const handleCommit: Handler<Commit> = async (repo, { message }) => {
  await repo.execGit('config', 'user.email', 'test@example.com')
  await repo.execGit('config', 'user.name', 'Test User')
  await repo.execGit('commit', '--allow-empty', '-m', message)
}

import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { commitRef, files, message, author },
): Promise<void> => {
  const commitArgs = await getParentCommit(
    commitRef.branchName,
    async parentCommitName => {
      await repo.exec('read-tree', [parentCommitName])
      return ['-p', parentCommitName]
    },
    async () => {
      await repo.exec('read-tree', ['--empty'])
      return []
    },
  )
  await addFiles()
  await commitIndex()

  async function addFiles() {
    for (const file of files) {
      const objectId = await repo.read('hash-object', ['-w', '--stdin'], { stdin: file.content })
      await repo.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path])
    }
  }

  async function commitIndex() {
    const treeName = await repo.read('write-tree')
    const commitName = await repo.read('commit-tree', [treeName, '-m', message, ...commitArgs], {
      env: { GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email },
    })
    await repo.exec('update-ref', [commitRef.local, commitName])
  }

  async function getParentCommit<ResultType = Promise<void>>(
    branchName: string,
    success: (commitName: string) => Promise<ResultType>,
    failure: () => Promise<ResultType>,
  ): Promise<ResultType> {
    return repo
      .read('show-ref', ['--hash', `refs/remotes/origin/${branchName}`])
      .then(success)
      .catch(failure)
  }
}

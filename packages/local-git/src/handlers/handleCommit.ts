import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Commit } from '../operations'
import fs from 'fs'
import { promisify } from 'util'
import { v4 as uuid } from 'uuid'
import { utils } from 'mocha'
import path from 'path'

const unlink = promisify(fs.unlink)

export const handleCommit: Handle<GitDirectory, AsyncCommand<Commit>> = async (
  repo,
  { commitRef, files, message, author },
): Promise<void> => {
  const indexFile = path.resolve(repo.path, `index-${commitRef.branchName.value}-${uuid()}`)
  const commitArgs = await getParentCommit(
    async parentCommitName => {
      await repo.exec('read-tree', [parentCommitName])
      return ['-p', parentCommitName]
    },
    async () => {
      await repo.exec('read-tree', ['--empty'], {
        env: { GIT_INDEX_FILE: indexFile },
      })
      return []
    },
  )
  await addFiles()
  await commitIndex()
  await deleteIndex()

  async function deleteIndex() {
    await unlink(indexFile)
  }

  async function addFiles() {
    for (const file of files) {
      const objectId = await repo.read('hash-object', ['-w', '--stdin'], { stdin: file.content })
      await repo.exec('update-index', ['--add', '--cacheinfo', '100644', objectId, file.path], {
        env: { GIT_INDEX_FILE: indexFile },
      })
    }
  }

  async function commitIndex() {
    const treeName = await repo.read('write-tree', [], {
      env: { GIT_INDEX_FILE: indexFile },
    })
    const commitName = await repo.read('commit-tree', [treeName, '-m', message, ...commitArgs], {
      env: {
        GIT_AUTHOR_NAME: author.name,
        GIT_AUTHOR_EMAIL: author.email,
        GIT_INDEX_FILE: indexFile,
      },
    })
    await repo.exec('update-ref', [commitRef.local.value, commitName])
  }

  async function getParentCommit<ResultType = Promise<void>>(
    success: (commitName: string) => Promise<ResultType>,
    failure: () => Promise<ResultType>,
  ): Promise<ResultType> {
    return repo.read('show-ref', ['--hash', commitRef.parent.value]).then(success).catch(failure)
  }
}

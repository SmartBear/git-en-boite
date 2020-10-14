import { AccessDenied, InvalidRepoUrl } from 'git-en-boite-core'
import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'
import { nanoid } from 'nanoid'

import { GitCommandError } from '../git_command_error'
import { GitDirectory } from '../git_directory'
import { ValidateRemote } from '../operations'

const handleRemoteError = (error: AccessDenied | GitCommandError) => {
  if (error instanceof AccessDenied) throw error
  throw new InvalidRepoUrl(error.message)
}

export const handleValidateRemote: Handle<GitDirectory, AsyncCommand<ValidateRemote>> = async (
  repo,
  { url },
) => {
  await repo.exec('ls-remote', [url.value]).catch(handleRemoteError)
  const objectId = await repo.read('hash-object', ['-w', '--stdin'], {
    stdin:
      'This is an automated permission check done by Git en Boîte.\nThis branch can safely be removed from the repository.',
  })
  await repo.exec('update-index', [
    '--add',
    '--cacheinfo',
    '100644',
    objectId,
    'GIT_EN_BOITE_PERMISSION_CHECK',
  ])
  const ref = `refs/heads/write-access-test-${nanoid(6)}`
  const treeName = await repo.read('write-tree', [])
  const commitName = await repo.read('commit-tree', [treeName, '-m', 'Check write access'])
  await repo.exec('update-ref', [ref, commitName])
  await repo.exec('push', [url.value, `${ref}`]).catch(handleRemoteError)
  await repo.exec('push', [url.value, `:${ref}`]).catch(handleRemoteError)
}

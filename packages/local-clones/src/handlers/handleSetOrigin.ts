import { SetOrigin } from '../operations'
import { Handle, AsyncCommand } from 'git-en-boite-message-dispatch'
import { GitDirectory } from '../git_directory'

export const handleSetOrigin: Handle<GitDirectory, AsyncCommand<SetOrigin>> = async (repo, { url }) => {
  const remotes = (await repo.exec('remote')).stdout.split('\n')
  if (remotes.includes('origin')) {
    await repo.exec('remote', ['set-url', 'origin', url.value])
  } else {
    await repo.exec('remote', ['add', 'origin', url.value])
  }
}

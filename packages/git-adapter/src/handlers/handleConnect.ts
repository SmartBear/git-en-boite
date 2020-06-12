import { AsyncCommand, Handle } from 'git-en-boite-command-bus'
import { Connect, Fetch, Init, SetOrigin } from 'git-en-boite-git-port'
import { GitDirectory } from '../git_directory'

export const handleConnect: Handle<GitDirectory, AsyncCommand<Connect>> = async (
  _,
  { remoteUrl },
  dispatch,
) => {
  await dispatch(SetOrigin.toUrl(remoteUrl))
  await dispatch(Fetch.fromOrigin())
}

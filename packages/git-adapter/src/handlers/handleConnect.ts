import { Command, Handle } from 'git-en-boite-command-bus'
import { Connect, Fetch, Init, SetOrigin } from 'git-en-boite-git-port'
import { GitDirectory } from 'git_directory'

export const handleConnect: Handle<GitDirectory, Command<Connect>> = async (
  _,
  { remoteUrl },
  dispatch,
) => {
  await dispatch(Init.bareRepo())
  await dispatch(SetOrigin.toUrl(remoteUrl))
  await dispatch(Fetch.fromOrigin())
}

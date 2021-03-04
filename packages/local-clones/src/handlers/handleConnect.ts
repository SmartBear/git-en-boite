import { AsyncCommand, Handle } from 'git-en-boite-message-dispatch'

import { GitDirectory } from '../git_directory'
import { Connect, SetOrigin, ValidateRemote } from '../operations'

export const handleConnect: Handle<GitDirectory, AsyncCommand<Connect>> = async (_, { remoteUrl }, dispatch) => {
  await dispatch(ValidateRemote.url(remoteUrl))
  await dispatch(SetOrigin.toUrl(remoteUrl))
}

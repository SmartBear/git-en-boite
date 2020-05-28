import { Connect, Init, SetOrigin, Fetch } from 'git-en-boite-git-port'

import { HandlesGitOperations } from './handles_git_operations'

export const handleConnect: HandlesGitOperations<Connect> = async (_, { remoteUrl }, dispatch) => {
  await dispatch(Init.bareRepo())
  await dispatch(SetOrigin.toUrl(remoteUrl))
  await dispatch(Fetch.fromOrigin())
}

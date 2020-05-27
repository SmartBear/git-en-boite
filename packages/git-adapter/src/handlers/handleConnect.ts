import { Connect, Init, SetOrigin, Fetch } from 'git-en-boite-git-port'

import { Handler } from './handler'

export const handleConnect: Handler<Connect> = async (_, { remoteUrl }, dispatch) => {
  await dispatch(Init.bareRepo())
  await dispatch(SetOrigin.toUrl(remoteUrl))
  await dispatch(Fetch.fromOrigin())
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { RemoteUrl, RepoId } from 'git-en-boite-core'
import Server from 'node-git-server'

// TODO: fix types in here, remove those eslint disablers

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runGitHttpServer = (getRoot: () => string, options: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gitPort = 4000
  let server: any
  beforeEach(async () => {
    server = new Server(getRoot(), {
      autoCreate: false,
      ...options,
    })
    await new Promise(started => server.listen(gitPort, started))
  })
  afterEach(async () => {
    await server.close().catch(() => {
      // ignore any error
    })
  })
  return (repoId: RepoId) => RemoteUrl.of(`http://localhost:${gitPort}/${repoId}`)
}

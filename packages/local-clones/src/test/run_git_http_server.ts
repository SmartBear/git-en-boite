import { RemoteUrl, RepoId } from 'git-en-boite-core'
import Server from 'node-git-server'

type ServerOptions = {
  autoCreate?: boolean
  authenticate?: ({ repo, type }: { repo: string; type: GitOperationType }) => Promise<void>
}

type GitOperationType = 'push' | 'fetch'

type StartServer = (repoId: RepoId) => RemoteUrl

export const runGitHttpServer = (getRoot: () => string, options: ServerOptions): StartServer => {
  const gitPort = 4000
  let server: {
    close: () => Promise<void>
    listen: (port: number, callback: (value: unknown) => void) => void
  }
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

import { After, Before, Status } from '@cucumber/cucumber'
import { World } from '../world'
import Server from 'node-git-server'
import { RemoteUrl, RepoId } from 'git-en-boite-core'
import getPort from 'get-port'
import path from 'path'
import fs from 'fs'
import { dirSync } from 'tmp'
import { ITestCaseHookParameter } from '@cucumber/cucumber/lib/support_code_library_builder/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any
let root: string

Before(async function (this: World) {
  const port = await getPort()
  root = dirSync().name
  server = new Server(root, {
    autoCreate: false,
  })
  await new Promise(started => server.listen(port, started))
  this.remoteUrl = (repoId: RepoId) => RemoteUrl.of(`http://localhost:${port}/${repoId}`)
  this.remotePath = (repoId: RepoId) => path.resolve(root, repoId.value)
  this.moveRemoteToPath = (oldRemotePath: string, newRemotePath: string) =>
    fs.renameSync(path.resolve(root, oldRemotePath), path.resolve(root, newRemotePath))
})

After(async ({ result }: ITestCaseHookParameter) => {
  if (result.status !== Status.PASSED) console.log(`Origin Git HTTP served from ${root}`)

  return server.close().catch(() => {
    // no-op
  })
})

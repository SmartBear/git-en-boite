import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { Application, DomainEventBus, fetchRepoAfterConnected } from 'git-en-boite-core'
import { BackgroundWorkerLocalClones, DirectLocalClone } from 'git-en-boite-local-clones'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { startWebServer } from 'git-en-boite-web'
import { runSmokeTests } from 'git-en-boite-smoke-tests'

import { LaBoîte } from './la_boîte'

const config = createConfig(process.env)
console.log(`git-en-boite starting up...`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

inConsole(async () => {
  const domainEvents: DomainEventBus = new EventEmitter()
  const localClones = await BackgroundWorkerLocalClones.connect(DirectLocalClone, config.redis)
  await localClones.pingWorkers()
  const logger = console
  const repoIndex = new DiskRepoIndex(config.git.root, localClones, domainEvents)
  const app: Application = new LaBoîte(
    repoIndex,
    config.version,
    domainEvents,
    [fetchRepoAfterConnected],
    logger,
  )

  const port = 3001
  const url = `http://localhost:${port}`
  startWebServer(app, port)
  await runSmokeTests(url)
  console.log(`Server listening on ${url}`)
})

function inConsole(start: () => Promise<void>): void {
  start()
    .then(() => console.log('git-en-boite started ✅'))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

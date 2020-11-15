import { startWebServer } from 'git-en-boite-web'
import { Application, DomainEventBus, fetchRepoAfterConnected, Logger } from 'git-en-boite-core'
import { BackgroundWorkerLocalClones, DirectLocalClone } from 'git-en-boite-local-clones'
import { InventoryOfReposOnDisk } from 'git-en-boite-inventory'

import { LaBoîte } from './la_boîte'
import { EventEmitter } from 'events'
import { runProcess } from './runProcess'
import { Config } from 'git-en-boite-config'

runProcess(async (config: Config, logger: Logger) => {
  logger.info(`git-en-boite server starting up`, { config })
  const domainEvents: DomainEventBus = new EventEmitter()
  const localClones = await BackgroundWorkerLocalClones.connect(
    DirectLocalClone,
    config.redis,
    config.git.queueName,
    logger,
  )
  await localClones.pingWorkers()
  const inventoryOfRepos = new InventoryOfReposOnDisk(config.git.root, localClones, domainEvents)
  const app: Application = new LaBoîte(
    inventoryOfRepos,
    config.version,
    domainEvents,
    [fetchRepoAfterConnected],
    logger,
  )

  const port = 3001
  startWebServer(app, port, logger)
  const url = `http://localhost:${port}`
  logger.info(`git-en-boite server listening on ${url} ✅`)
})

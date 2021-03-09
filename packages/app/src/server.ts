import { EventEmitter } from 'events'
import { Config } from 'git-en-boite-config'
import {
  Application,
  DomainEventBus,
  DomainEvents,
  DomainRule,
  fetchRepoAfterConnected,
  WriteLogEvent,
} from 'git-en-boite-core'
import { InventoryOfReposOnDisk } from 'git-en-boite-inventory'
import { BackgroundWorkerLocalClones, DirectLocalClones } from 'git-en-boite-local-clones'
import { startWebServer } from 'git-en-boite-web'
import { GlobalDomainEventBus } from './GlobalDomainEventBus'

import { LaBoîte } from './la_boîte'
import { runProcess } from './runProcess'

runProcess(async (config: Config, log: WriteLogEvent) => {
  log({ level: 'info', message: `git-en-boite server starting up`, config })
  const logDomainEvents: DomainRule = (events) => {
    for (const eventKey of DomainEvents.keys) {
      events.on(eventKey, (event) => log({ level: 'info', message: eventKey, event }))
    }
  }
  const localClones = await BackgroundWorkerLocalClones.connect(
    new DirectLocalClones(),
    config.redis,
    config.git.queueName,
    log
  )
  await localClones.pingWorkers()
  const localDomainEventBus: DomainEventBus = new EventEmitter()
  const inventoryOfRepos = new InventoryOfReposOnDisk(config.git.root, localClones, localDomainEventBus)
  const globalDomainEventBus = await (await GlobalDomainEventBus.connect(config.redis)).listenTo(localDomainEventBus)
  const app: Application = new LaBoîte(inventoryOfRepos, config.version, globalDomainEventBus)
  const domainRules = [logDomainEvents, fetchRepoAfterConnected]
  domainRules.map((rule) => rule(localDomainEventBus, app, log))

  const port = 3001
  startWebServer(app, port, log)
  const url = `http://localhost:${port}`
  log({ level: 'info', message: `git-en-boite server listening on ${url} ✅` })
})

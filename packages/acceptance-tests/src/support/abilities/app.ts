import { Before } from '@cucumber/cucumber'
import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { fetchRepoAfterConnected, Logger } from 'git-en-boite-core'
import { DirectLocalClone } from 'git-en-boite-local-clones'
import { InventoryOfReposOnDisk } from 'git-en-boite-inventory'
import { dirSync } from 'tmp'

import { LaBoîte } from 'git-en-boite-app'
import { World } from '../world'

Before(async function (this: World) {
  this.domainEvents = new EventEmitter()
  const config = createConfig()
  const gitReposPath = dirSync().name
  const repoIndex = new InventoryOfReposOnDisk(gitReposPath, DirectLocalClone, this.domainEvents)
  const logger = Logger.none
  this.app = new LaBoîte(
    repoIndex,
    config.version,
    this.domainEvents,
    [fetchRepoAfterConnected],
    logger,
  )
})

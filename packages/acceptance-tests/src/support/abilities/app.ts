import { Before } from '@cucumber/cucumber'
import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { fetchRepoAfterConnected } from 'git-en-boite-core'
import { DirectLocalClones } from 'git-en-boite-local-clones'
import { InventoryOfReposOnDisk } from 'git-en-boite-inventory'
import { dirSync } from 'tmp'

import { LaBoîte } from 'git-en-boite-app'
import { World } from '../world'
import { setUpLogger } from 'git-en-boite-logging'
const config = createConfig()
console.log(`Starting acceptance tests with config: 🥁\n${JSON.stringify(config, null, 2)}\n`)

Before(async function (this: World) {
  this.domainEvents = new EventEmitter()
  this.log = setUpLogger({}, config.logging)
  const gitReposPath = dirSync().name
  const repoIndex = new InventoryOfReposOnDisk(gitReposPath, new DirectLocalClones(), this.domainEvents)
  this.app = new LaBoîte(repoIndex, config.version, this.domainEvents, [fetchRepoAfterConnected], this.log)
})

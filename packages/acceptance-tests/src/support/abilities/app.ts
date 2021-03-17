import { Before } from '@cucumber/cucumber'
import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { DomainEvents, fetchRepoAfterConnected } from 'git-en-boite-core'
import { DirectLocalClones } from 'git-en-boite-local-clones'
import { InventoryOfReposOnDisk } from 'git-en-boite-inventory'
import { dirSync } from 'tmp'

import { LaBoîte, logDomainEvents } from 'git-en-boite-app'
import { World } from '../world'
import { setUpLogger } from 'git-en-boite-logging'
const config = createConfig()
console.log(`Starting acceptance tests with config: 🥁\n${JSON.stringify(config, null, 2)}\n`)

Before(async function (this: World) {
  this.domainEvents = new EventEmitter()
  this.log = setUpLogger({}, config.logging)
  const gitReposPath = dirSync().name
  const repoIndex = new InventoryOfReposOnDisk(gitReposPath, new DirectLocalClones(), this.domainEvents)
  this.app = new LaBoîte(repoIndex, config.version, this.domainEvents)
  const domainRules = [logDomainEvents(this.log), fetchRepoAfterConnected]
  domainRules.map((rule) => rule(this.domainEvents, this.app, this.log))
})

Before(function (this: World) {
  this.receivedDomainEvents = []
  for (const eventName of DomainEvents.names) {
    this.domainEvents.on(eventName, (event) => {
      this.receivedDomainEvents.push(event)
    })
  }
})

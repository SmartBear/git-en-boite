import { Before } from 'cucumber'
import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { fetchRepoAfterConnected, Logger } from 'git-en-boite-core'
import { DugiteGitRepo } from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { dirSync } from 'tmp'

import { LaBoîte } from '../../../la_boîte'

Before(async function () {
  this.domainEvents = new EventEmitter()
  const config = createConfig()
  const gitReposPath = dirSync().name
  const repoIndex = new DiskRepoIndex(gitReposPath, DugiteGitRepo, this.domainEvents)
  const logger = Logger.none
  this.app = new LaBoîte(
    repoIndex,
    config.version,
    this.domainEvents,
    [fetchRepoAfterConnected],
    logger,
  )
})

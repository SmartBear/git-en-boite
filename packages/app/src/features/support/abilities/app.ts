import { Before } from 'cucumber'
import { createConfig } from 'git-en-boite-config'
import { DugiteGitRepo } from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { dirSync } from 'tmp'

import { LaBoîte } from '../../../la_boîte'
import { EventEmitter } from 'events'

Before(async function () {
  this.domainEvents = new EventEmitter()
  const config = createConfig()
  const gitReposPath = dirSync().name
  const repoIndex = new DiskRepoIndex(gitReposPath, DugiteGitRepo, this.domainEvents)
  this.app = new LaBoîte(repoIndex, config.version)
})

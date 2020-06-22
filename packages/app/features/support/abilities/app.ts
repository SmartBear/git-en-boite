import { After, Before } from 'cucumber'
import { createConfig } from 'git-en-boite-config'
import { BareRepoFactory } from 'git-en-boite-git-adapter'
import { DiskRepoIndex } from 'git-en-boite-repo-index-adapter'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'
import { dirSync } from 'tmp'

import { LaBoîte } from '../../../src/la_boîte'

Before(async function () {
  const config = createConfig()
  const gitReposPath = dirSync().name
  const taskScheduler = BullRepoTaskScheduler.make(config.redis)
  const gitRepoFactory = new BareRepoFactory()
  const repoIndex = new DiskRepoIndex(gitReposPath, gitRepoFactory)
  this.app = new LaBoîte(taskScheduler, repoIndex, config.version)
})

After(async function () {
  this.app.close()
})

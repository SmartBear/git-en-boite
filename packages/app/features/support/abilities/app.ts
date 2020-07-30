import { Before } from 'cucumber'
import { createConfig } from 'git-en-boite-config'
import { DugiteGitRepo } from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { dirSync } from 'tmp'

import { LaBoîte } from '../../../src/la_boîte'

Before(async function () {
  const config = createConfig()
  const gitReposPath = dirSync().name
  const repoIndex = new DiskRepoIndex(gitReposPath, DugiteGitRepo)
  this.app = new LaBoîte(repoIndex, config.version)
})

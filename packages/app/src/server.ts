import { createWebApp } from 'git-en-boite-client-adapter-web'
import { Application } from 'git-en-boite-client-port'
import { createConfig } from 'git-en-boite-config'
import { DugiteGitRepo, BullGitRepoFactory, BullGitRepoWorker } from 'git-en-boite-git-adapter'
import { DiskRepoIndex } from 'git-en-boite-repo-index-adapter'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'

import { LaBoîte } from './la_boîte'

const config = createConfig(process.env)
console.log(`git-en-boite starting up`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

const taskScheduler = BullRepoTaskScheduler.make(config.redis)
const gitRepoFactory = new BullGitRepoFactory(DugiteGitRepo.open, config.redis)
const repoIndex = new DiskRepoIndex(config.git.root, (path: string) => gitRepoFactory.open(path))
const app: Application = new LaBoîte(taskScheduler, repoIndex, config.version)
BullGitRepoWorker.start(config.redis, DugiteGitRepo.open)

const port = 3001
const host = 'localhost'
const webApp = createWebApp(app)
webApp.listen(port)
console.log(`Server listening on http://${host}:${port}`)

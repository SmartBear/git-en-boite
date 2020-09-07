import { startWebServer } from 'git-en-boite-web'
import { Application, DomainEventBus, fetchRepoAfterConnected } from 'git-en-boite-core'
import { createConfig } from 'git-en-boite-config'
import { BackgroundGitRepos, DugiteGitRepo } from 'git-en-boite-local-git'
import { DiskRepoIndex } from 'git-en-boite-repo-index'

import { LaBoîte } from './la_boîte'
import { EventEmitter } from 'events'

const config = createConfig(process.env)
console.log(`git-en-boite starting up...`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

inConsole(async () => {
  const domainEvents: DomainEventBus = new EventEmitter()
  const gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
  await gitRepos.pingWorkers()
  const repoIndex = new DiskRepoIndex(config.git.root, gitRepos, domainEvents)
  const app: Application = new LaBoîte(repoIndex, config.version, domainEvents, [
    fetchRepoAfterConnected,
  ])

  const port = 3001
  startWebServer(app, port)
  console.log(`Server listening on http://localhost:${port}`)
})

function inConsole(start: () => Promise<void>): void {
  start()
    .then(() => console.log('git-en-boite started ✅'))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

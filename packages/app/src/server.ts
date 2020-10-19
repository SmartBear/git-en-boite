import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { createConfig } from 'git-en-boite-config'
import { Application, DomainEventBus, fetchRepoAfterConnected } from 'git-en-boite-core'
import { BackgroundWorkerLocalClones, DirectLocalClone } from 'git-en-boite-local-clones'
import { DiskRepoIndex } from 'git-en-boite-repo-index'
import { startWebServer } from 'git-en-boite-web'
import path from 'path'

import { LaBoîte } from './la_boîte'

const config = createConfig(process.env)
console.log(`git-en-boite starting up...`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

const runSmokeTests = async (url: string) => {
  const cwd = path.resolve(__dirname, '../..')
  const child = spawn('yarn', ['smoke', 'start'], {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      smoke_tests_web_server_url: url,
    },
  })

  return new Promise((resolve, reject) => {
    child.on('exit', status => {
      if (status !== 0) return reject(new Error('Smoke tests failed'))
      resolve()
    })
  })
}

inConsole(async () => {
  const domainEvents: DomainEventBus = new EventEmitter()
  const localClones = await BackgroundWorkerLocalClones.connect(DirectLocalClone, config.redis)
  await localClones.pingWorkers()
  const logger = console
  const repoIndex = new DiskRepoIndex(config.git.root, localClones, domainEvents)
  const app: Application = new LaBoîte(
    repoIndex,
    config.version,
    domainEvents,
    [fetchRepoAfterConnected],
    logger,
  )

  const port = 3001
  startWebServer(app, port)
  if (process.env.smoke_tests_remote_repo_url) {
    console.log('Running smoke tests...')
    await runSmokeTests('http://localhost:3001')
    console.log('Done...')
  }
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

import { BackgroundWorkerLocalClones, DirectLocalClone } from 'git-en-boite-local-clones'
import { createConfig } from 'git-en-boite-config'

const config = createConfig(process.env)

function inConsole(start: () => Promise<void>): void {
  start()
    .then(() => console.log('git-en-boite git background worker started ✅'))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

inConsole(async () => {
  const localClones = await BackgroundWorkerLocalClones.connect(
    DirectLocalClone,
    config.redis,
    config.git.queueName,
  )
  await localClones.startWorker(console)
})

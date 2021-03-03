import { BackgroundWorkerLocalClones, DirectLocalClones } from 'git-en-boite-local-clones'

import { runProcess } from './runProcess'

runProcess(async (config, log) => {
  log({ level: 'info', message: 'git-en-boite background worker starting up', config })
  const localClones = await BackgroundWorkerLocalClones.connect(
    new DirectLocalClones(),
    config.redis,
    config.git.queueName,
    log,
  )
  await localClones.startWorker(log)
  log({ level: 'info', message: 'git-en-boite background worker started ✅' })
})

import { BackgroundWorkerLocalClones, DirectLocalClone } from 'git-en-boite-local-clones'
import { runProcess } from './runProcess'

runProcess(async (config, logger) => {
  logger.info('git-en-boite background worker starting up', { config })
  const localClones = await BackgroundWorkerLocalClones.connect(
    DirectLocalClone,
    config.redis,
    config.git.queueName,
  )
  await localClones.startWorker(logger)
  logger.info('git-en-boite background worker started ✅')
})

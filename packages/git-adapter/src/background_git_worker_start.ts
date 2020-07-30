import IORedis from 'ioredis'
import { BackgroundGitRepoWorker } from './background_git_repos'
import { DugiteGitRepo } from './dugite_git_repo'

const createRedisClient = () => connectToRedis(process.env.REDIS_URL)

function inConsole(start: () => Promise<void>): void {
  start()
    .then(() => console.log('git-en-boite git background worker started ✅'))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

inConsole(async () => {
  await BackgroundGitRepoWorker.start(DugiteGitRepo, createRedisClient)
  process.send('ready')
})

async function connectToRedis(url: string): Promise<IORedis.Redis> {
  const connection = new IORedis(url)
  return new Promise((resolve, reject) =>
    connection
      .on('connect', () => resolve(connection))
      .on('error', error => {
        connection.disconnect()
        reject(new Error(`Unable to connect to Redis: ${error.message}`))
      }),
  )
}

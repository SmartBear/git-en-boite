import { BackgroundGitRepos, DugiteGitRepo } from 'git-en-boite-local-git'
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
  const gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
  await gitRepos.startWorker()
})

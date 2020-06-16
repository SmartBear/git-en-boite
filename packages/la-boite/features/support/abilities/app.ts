import { Before, After } from 'cucumber'
import { createConfig } from 'git-en-boite-config'
import { LocalGitRepos } from '../../../src/local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'
import { BareRepoFactory } from 'git-en-boite-git-adapter'
import { DiskRepoIndex } from 'git-en-boite-repo-index-adapter'
const exec = promisify(childProcess.exec)

Before(async function () {
  const config = createConfig()
  const gitReposPath = config.git.root
  await exec(`rm -rf ${gitReposPath}`)
  await exec(`mkdir -p ${gitReposPath}`)
  const taskScheduler = BullRepoTaskScheduler.make(config.redis)
  const gitRepoFactory = new BareRepoFactory()
  const repoIndex = new DiskRepoIndex(gitReposPath, gitRepoFactory)
  this.app = new LocalGitRepos(taskScheduler, repoIndex, config.version)
  let nextRepoId = 0
  this.getNextRepoId = () => `repo-${nextRepoId++}`
})

After(async function () {
  this.app.close()
})

import { Before, After } from 'cucumber'
import { createConfig } from 'git-en-boite-config'
import { LocalGitRepos } from '../../../src/local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import { BullRepoTaskScheduler } from 'git-en-boite-task-scheduler-adapter'
const exec = promisify(childProcess.exec)

Before(async function () {
  const gitReposPath = createConfig().git.root
  await exec(`rm -rf ${gitReposPath}`)
  await exec(`mkdir -p ${gitReposPath}`)
  const taskScheduler = BullRepoTaskScheduler.make(createConfig().redis)
  this.app = { repos: new LocalGitRepos(gitReposPath, taskScheduler) }
  let nextRepoId = 0
  this.getNextRepoId = () => `repo-${nextRepoId++}`
})

After(async function () {
  this.app.repos.close()
})

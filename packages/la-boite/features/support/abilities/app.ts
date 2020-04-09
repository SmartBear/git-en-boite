import { Before } from 'cucumber'
import { createConfig } from '../../../src/config'
import { LocalGitRepos } from '../../../src/repos/local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'

const exec = promisify(childProcess.exec)

Before(async function () {
  const gitReposPath = createConfig().git.root
  await exec(`rm -rf ${gitReposPath}`)
  await exec(`mkdir -p ${gitReposPath}`)
  this.app = new LocalGitRepos(gitReposPath)
})

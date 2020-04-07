import path from 'path'
import { Before } from 'cucumber'
import { LocalGitRepos } from '../../../src/repos/local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'

const exec = promisify(childProcess.exec)

Before(async function () {
  const gitReposPath = path.resolve(__dirname, '../../../tmp/test')
  await exec(`rm -rf ${gitReposPath}`)
  await exec(`mkdir -p ${gitReposPath}`)
  this.app = new LocalGitRepos(gitReposPath)
})

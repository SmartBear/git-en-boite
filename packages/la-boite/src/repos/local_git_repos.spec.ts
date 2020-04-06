import path from 'path'
import { LocalGitRepos } from './local_git_repos'
import childProcess from 'child_process'
import { promisify } from 'util'
import { assertThat, equalTo } from 'hamjest'
const exec = promisify(childProcess.exec)

describe(LocalGitRepos.name, () => {
  const tmp = path.resolve(__dirname, '../../tmp')

  before(async () => {
    await exec(`rm -rf ${tmp}`)
  })

  it('can find an existing repo in the folder', async () => {
    await exec(`mkdir -p ${tmp}/a-repo-id`)
    const repos = new LocalGitRepos(tmp)
    const repo = repos.findRepo('a-repo-id')
    assertThat(repo.id, equalTo('a-repo-id'))
  })
})

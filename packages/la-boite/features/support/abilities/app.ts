import { Before } from 'cucumber'
import { LocalGitRepos } from '../../../src/repos/local_git_repos'

Before(function () {
  this.app = new LocalGitRepos()
})

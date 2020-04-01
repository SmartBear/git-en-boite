import request from 'supertest'
import { create } from '../../../src/web_app'
import { Before, After } from 'cucumber'
import { LocalGitRepos } from '../../../src/repos/local_git_repos'

Before(function () {
  this.app = new LocalGitRepos()
  const webApp = create(this.app)
  this.webServer = webApp.listen(8888)
  this.request = request(this.webServer)
})

After(function () {
  this.webServer.close()
})

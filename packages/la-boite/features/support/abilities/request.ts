import request from 'supertest'
import { create } from '../../../src/web_app'
import { Before, After } from 'cucumber'
import { LocalGitRepos } from '../../../src/repos/local_git_repos'
import { Server } from 'http'

let webServer: Server

Before(function () {
  this.app = new LocalGitRepos()
  const webApp = create(this.app)
  webServer = webApp.listen(8888)
  this.request = request(webServer)
})

After(function () {
  webServer.close()
})

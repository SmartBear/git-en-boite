import request from 'supertest'
import { Before, After } from 'cucumber'
import { Server } from 'http'
import { createWebApp } from 'git-en-boite-client-adapter-web'

let webServer: Server

Before(function () {
  const webApp = createWebApp(this.app)
  webServer = webApp.listen(8888)
  this.request = request(webServer)
})

After(function () {
  webServer.close()
})

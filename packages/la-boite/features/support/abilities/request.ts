import request from 'supertest'
import WebApp from '../../../src/web_app'
import Router from '../../../src/router'
import { Before, After } from 'cucumber'
import { Server } from 'http'

let webServer: Server

Before(function () {
  const routes = Router.create(this.app)
  const webApp = WebApp.withRoutes(routes)
  webServer = webApp.listen(8888)
  this.request = request(webServer)
})

After(function () {
  webServer.close()
})

import request from 'supertest'
import { Before, After } from '@cucumber/cucumber'
import { Server } from 'http'
import { startWebServer } from 'git-en-boite-web'
import { World } from '../world'

let webServer: Server

Before(function (this: World) {
  webServer = startWebServer(this.app, 8888, this.log)
  this.request = request(webServer)
})

After(function () {
  if (webServer) webServer.close()
})

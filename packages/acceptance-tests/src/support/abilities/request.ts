import request from 'supertest'
import { Before, After } from '@cucumber/cucumber'
import { Server } from 'http'
import { startWebServer } from 'git-en-boite-web'
import { World } from '../world'
import { createLogger } from 'git-en-boite-app'

let webServer: Server

const logger = createLogger({ readableBy: process.env.show_logs ? 'humans' : 'nobody' })

Before(function (this: World) {
  webServer = startWebServer(this.app, 8888, logger)
  this.request = request(webServer)
})

After(function () {
  if (webServer) webServer.close()
})

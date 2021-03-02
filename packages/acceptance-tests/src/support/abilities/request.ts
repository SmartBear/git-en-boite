import request from 'supertest'
import { Before, After } from '@cucumber/cucumber'
import { Server } from 'http'
import { startWebServer } from 'git-en-boite-web'
import { World } from '../world'

let webServer: Server

const log = process.env.show_logs ? console.log : () => ({})

Before(function (this: World) {
  webServer = startWebServer(this.app, 8888, log)
  this.request = request(webServer)
})

After(function () {
  if (webServer) webServer.close()
})

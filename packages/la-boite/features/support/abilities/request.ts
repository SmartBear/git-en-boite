import request from 'supertest'
import { webApp } from '../../../src/web_app'
import { Before, After } from 'cucumber'

Before(function () {
  this.webServer = webApp.listen(8888)
  this.request = request(this.webServer)
})

After(function () {
  this.webServer.close()
})

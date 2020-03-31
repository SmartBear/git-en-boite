import request from 'supertest'
import { create } from '../../../src/web_app'
import { Before, After } from 'cucumber'

Before(function () {
  const webApp = create()
  this.webServer = webApp.listen(8888)
  this.request = request(this.webServer)
})

After(function () {
  this.webServer.close()
})

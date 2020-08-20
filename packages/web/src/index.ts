import { Application } from 'git-en-boite-core'
import { Server } from 'http'

import createWebApp from './create_web_app'
import createRouter from './routes/router'

export const startWebServer = (app: Application, port: number): Server => {
  return createWebApp(createRouter(app)).listen(port)
}

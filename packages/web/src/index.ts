import { Application, Logger } from 'git-en-boite-core'
import { Server } from 'http'

import createWebApp from './create_web_app'
import createRouter from './routes/router'

export const startWebServer = (app: Application, port: number, logger: Logger): Server => {
  return createWebApp(createRouter(app), logger).listen(port)
}
